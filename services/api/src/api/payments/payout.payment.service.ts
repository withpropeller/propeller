import { Inject, Injectable, Scope } from '@nestjs/common';
import { ModuleRef, REQUEST } from '@nestjs/core';
import { TenantRequestPayload } from '@core/helpers/tenant-context-id.strategy';
import { IFundingSource } from './payment.schema';
import { AppStatus, Utils } from '@core/helpers';
import { GetTagModel, ModelIdTag, TagMap } from '@core/mongo';
import { AccessKey } from '@core/interfaces';
import { HydratedDocument } from 'mongoose';
import { AccountService } from '@api/account/account.service';
import { CustomerService } from '@api/customer/customer.service';
import { AppException } from '@core/exceptions';
import { BusinessService } from '@models/business/business.service';
import { EnvoyService } from '@common/envoy';
import { TransactionCurrency, TransactionProcessor } from '@api/transactions/transactions.enums';
import { Business } from '@models/business/business.schema';
import { PaymentException } from './payment.exception';
import { IFeesBreakdown, ITransferBreakdown } from '@api/tools/banks/banks.interface';
import { FeeBreakdownType, FeeGroup } from '@api/fees/fee.schema';
import { FxQuote } from '@common/integrations/integrations.interfaces';
import { PaymentService } from './payment.service';
import { PaymentMethod, PaymentType } from './payment.enums';
import { CreatePayoutPaymentDto } from './payment.dto';
import { Configuration } from '@api/tools/configuration/configuration.schema';
import { ConfigurationService } from '@api/tools/configuration/configuration.service';
import { FeeStatus } from '@api/fees/fee.enums';
import { FeeService } from '@api/fees/fee.service';
import { TransferService } from '@api/tools';
import { FxService } from '@api/tools/fx/fx.service';
import { ExecutionOptions } from '@common/interfaces';
import { ConfigService } from '@config/config.service';
import { subMinutes } from 'date-fns';
import { EventService } from '@api/events/events.service';
import { ensureNoDuplicatePayment } from './payment.utils';
import { AccountCurrency } from '@api/account/account.enums';
import { toAccountCurrency } from '@api/balance/balance.utils';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class PayoutPaymentService extends PaymentService {
    constructor(
        @Inject(REQUEST) request: TenantRequestPayload,
        envoy: EnvoyService,
        moduleRef: ModuleRef,
        customerService: CustomerService,
        accountService: AccountService,
        eventService: EventService,
        private businessService: BusinessService,
        private toolsService: FxService,
        private transferService: TransferService,
        private configurationService: ConfigurationService,
        private feeService: FeeService,
        config: ConfigService,
    ) {
        super(request, envoy, moduleRef, customerService, accountService, eventService, config);
    }

    async create(data: CreatePayoutPaymentDto, key: AccessKey, options: ExecutionOptions) {
        // make sure we have a payment method
        if (!data.method && !data.options.method) {
            throw AppException.BadRequest.setMessage('Payment method is required');
        }

        const business = await this.businessService.safeGet(key.businessId, this.request);

        // Get the payment configuration
        const config = await this.configurationService.get(business, 'payment');

        // Check if payment reference already exists
        if (data.reference) {
            const payment = await this.repo.findOne({ reference: data.reference, business: business.id }, true, 'id');
            if (payment) {
                throw AppException.ReferenceConflict;
            }
        }

        if (data.method == PaymentMethod.BankTransfer || data.options.method == PaymentMethod.BankTransfer) {
            return this.createBankTransfer(business, config, data, options);
        }

        if (data.options.method == PaymentMethod.LocalTransfer) {
            return this.createLocalTransfer(business, config, data, options);
        }
    }

    async createFxTransfer(
        business: HydratedDocument<Business>,
        config: HydratedDocument<Configuration>,
        data: CreatePayoutPaymentDto,
    ) {
        if (data.options.fxCurrency == data.currency) {
            throw PaymentException.FxSameCurrency;
        }

        // Get the funding source account
        const debitSource = await this.getDebitSource(
            business,
            config,
            data.debitSource,
            toAccountCurrency(data.currency),
        );

        // Get the customer
        const customer = await this.getCustomer(business, debitSource, data.customer);

        // Get the fx destination account
        const destination = await this.getDestination(business, data);

        // Get Fx Quote
        const fxQuote = await this.getFxQuote(data);

        // Get Fee breakdown
        const breakdown = await this.getFxFeeBreakdown(fxQuote);

        const entity = Utils.removeNilValues({
            type: PaymentType.PayOut,
            processor:
                data.options.method == PaymentMethod.Transfer
                    ? TransactionProcessor.Allawee
                    : TransactionProcessor.Maplerad,
            business: business.id,
            customer: customer?.id,
            reference: data.reference,
            amount: data.amount,
            fees: breakdown.totalFees,
            feesBreakdown: breakdown.feesBreakdown,
            currency: data.currency,
            source: debitSource.id,
            sourceRef: debitSource.ref,
            method: data.options.method,
            methodData: {
                fxLocalTransfer: {
                    destination: destination.id,
                    destinationRef: destination.ref,
                    currency: data.options.fxCurrency,
                    quoteHash: data.options.fxQuoteHash,
                    rate: fxQuote.rate,
                    amount: fxQuote.toAmount,
                },
            },
            metadata: data.metadata,
        });

        try {
            const payment = await this.repo.createAndSave(entity);

            // create and send the envoy event
            //await this.sendPaymentEvent(payment);

            return payment;
        } catch (err) {
            if (err instanceof AppException && err.getCode() === AppStatus.Conflict) {
                throw AppException.ReferenceConflict;
            }
            throw AppException.ServiceUnavailable.setError(err);
        }
    }

    async createBankTransfer(
        business: HydratedDocument<Business>,
        config: HydratedDocument<Configuration>,
        data: CreatePayoutPaymentDto,
        options: ExecutionOptions,
    ) {
        // Check if similar payment in the last 5 minutes exists to prevent duplicate payments
        await ensureNoDuplicatePayment(this.repo, business, data);

        // get bank details
        const bank = await this.transferService.getBankWithCode(data.options.bankCode);
        if (!bank) {
            throw PaymentException.InvalidBankCode;
        }

        // get breakdown
        const breakdown = await this.getBankTransferFeeBreakdown(config, data);

        // Get the payout account & funding source
        const debitSource = await this.getDebitSource(
            business,
            config,
            data.debitSource,
            toAccountCurrency(data.currency),
        );

        // Get the customer
        const customer = await this.getCustomer(business, debitSource, data.customer);

        const entity = {
            type: PaymentType.PayOut,
            processor: breakdown.processor,
            business: business.id,
            customer: customer?.id,
            reference: data.reference,
            amount: data.amount,
            fees: breakdown.totalFees,
            feesBreakdown: breakdown.feesBreakdown,
            currency: data.currency,
            fundingSource: debitSource.id,
            fundingSourceRef: debitSource.ref,
            account: debitSource.account.id,
            method: data.method ?? data.options.method,
            methodData: {
                bankTransfer: {
                    sourceAccountName: customer ? customer.name : debitSource.account.name,
                    accountNumber: data.options.accountNumber,
                    accountName: breakdown.resolvedAccount.name,
                    narration: data.options.narration,
                    bankCode: bank.code,
                    bankName: bank.name,
                },
            },
            metadata: data.metadata,
        };

        try {
            const payment = await this.repo.createAndSave(entity, options);

            // create and send the envoy event
            if (!options?.dryRun) {
                await this.sendToEnvoy(payment);
            }

            return payment;
        } catch (err) {
            if (err instanceof AppException && err.getCode() === AppStatus.Conflict) {
                throw AppException.ReferenceConflict;
            }
            throw AppException.ServiceUnavailable.setError(err);
        }
    }

    async createLocalTransfer(
        business: HydratedDocument<Business>,
        config: HydratedDocument<Configuration>,
        data: CreatePayoutPaymentDto,
        options: ExecutionOptions,
    ) {
        // Check if similar payment in the last 5 minutes exists to prevent duplicate payments
        const recentPayment = await this.repo.findOne(
            {
                business: business.id,
                type: PaymentType.PayOut,
                amount: data.amount,
                'methodData.localTransfer.destination': data.options.destination.id,
                createdAt: { $gte: subMinutes(new Date(), 5) },
            },
            true,
            'id',
        );
        if (recentPayment) {
            throw PaymentException.DuplicatePayment;
        }

        // Get the payout account & funding source
        const debitSource = await this.getDebitSource(
            business,
            config,
            data.debitSource,
            toAccountCurrency(data.currency),
        );

        // Get the destination account
        const destination = await this.getAccountFundingSource(
            business,
            data.options.destination.id,
            toAccountCurrency(data.currency),
        );

        if (debitSource.id === destination.id) {
            throw PaymentException.SameAccountTransfer;
        }

        // Get the customer
        const customer = await this.getCustomer(business, debitSource, data.customer);

        const entity = Utils.removeNilValues({
            type: PaymentType.PayOut,
            business: business.id,
            customer: customer?.id,
            reference: data.reference,
            amount: data.amount,
            fees: 0,
            currency: data.currency,
            account: debitSource.account.id,
            method: data.options.method,
            methodData: {
                localTransfer: {
                    destination: destination.account.id,
                    note: data.options.note,
                },
            },
            metadata: data.metadata,
        });

        try {
            const payment = await this.repo.createAndSave(entity, options);

            // create and send the envoy event
            if (!options?.dryRun) {
                await this.sendToEnvoySync(payment);
            }

            return payment;
        } catch (err) {
            if (err instanceof AppException && err.getCode() === AppStatus.Conflict) {
                throw AppException.ReferenceConflict;
            }
            throw AppException.ServiceUnavailable.setError(err);
        }
    }

    async getDebitSource(
        business: HydratedDocument<Business>,
        config: HydratedDocument<Configuration>,
        source: TagMap,
        currency: AccountCurrency,
    ): Promise<IFundingSource> {
        if (source) {
            return this.getFundingSource(business, source, currency);
        }

        if (config?.payment?.payOutAccount) {
            return this.getAccountFundingSource(business, config.payment.payOutAccount, currency);
        }

        const account = await this.accountService.safeGetMainDefault(business.id, currency as any);
        return {
            id: account.id,
            ref: GetTagModel(ModelIdTag.Account),
            account: account,
        };
    }

    async getFxQuote(data: CreatePayoutPaymentDto): Promise<FxQuote> {
        const quote = await this.toolsService.getFxQuote({
            from: data.currency,
            to: data.options.fxCurrency,
            amount: data.amount,
        });

        if (quote.hash != data.options.fxQuoteHash) {
            throw PaymentException.FxHashInvalid;
        }

        return quote;
    }

    async getFxFeeBreakdown(quote: FxQuote): Promise<IFeesBreakdown> {
        const feesBreakdown: IFeesBreakdown = {
            totalFees: 0,
            feesBreakdown: [
                {
                    type: FeeBreakdownType.FxPurchase,
                    group: FeeGroup.Platform,
                    amount: quote.feeAmount,
                    integral: true,
                },
            ],
            processor: TransactionProcessor.Maplerad,
        };

        return feesBreakdown;
    }

    private async getBankTransferFeeBreakdown(
        config: HydratedDocument<Configuration>,
        data: CreatePayoutPaymentDto,
    ): Promise<ITransferBreakdown> {
        if (data.fee) {
            const fee = await this.feeService.repo.findOneById(data.fee.id);
            if (fee && fee.status === FeeStatus.Active && fee.currency === data.currency) {
                return this.transferService.getTransferBreakdown(
                    data.options.bankCode,
                    data.options.accountNumber,
                    Utils.safeNumber(data.amount),
                    fee,
                );
            }
        }

        if (config?.payment?.fees?.bankTransfer) {
            const fee = await this.feeService.repo.findOneById(config.payment.fees.bankTransfer);
            if (fee && fee.status === FeeStatus.Active && fee.currency === data.currency) {
                return this.transferService.getTransferBreakdown(
                    data.options.bankCode,
                    data.options.accountNumber,
                    Utils.safeNumber(data.amount),
                    fee,
                );
            }
        }

        return this.transferService.getTransferBreakdown(
            data.options.bankCode,
            data.options.accountNumber,
            Utils.safeNumber(data.amount),
        );
    }

    private async getDestination(
        business: HydratedDocument<Business>,
        data: CreatePayoutPaymentDto,
    ): Promise<IFundingSource> {
        const destination = data.options.destination;
        const currency = data.options.fxCurrency ?? data.currency;

        return this.getFundingSource(business, destination, toAccountCurrency(currency));
    }
}

// providus 7.4m
// maplerad 2.6m

// exchange on maplerad ---

// debit naira from isv account ---
// credit fx naira reserve account 600k --

// credit destination account 1k usd ---
// debit maplerad vostro account 1k usd ---

// fund debit card ---

// debit from reserve account 600k
// credit providus vostro account

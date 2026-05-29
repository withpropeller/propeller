import { Inject, Injectable, Scope } from '@nestjs/common';
import { ModuleRef, REQUEST } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Repository, RepositoryFactory } from '@core/abstracts';
import { TenantRequestPayload, GetTenantDataSource } from '@core/helpers/tenant-context-id.strategy';
import { IFundingSource, Payment } from './payment.schema';
import { Utils } from '@core/helpers';
import { APIPagingDto } from '@common/api-paging';
import { HydratedDocument, Types } from 'mongoose';
import { CustomerService } from '@api/customer/customer.service';
import { EnvoyEvent, EnvoyService } from '@common/envoy';
import { Business } from '@models/business/business.schema';
import { FxQuote } from '@common/integrations/integrations.interfaces';
import { FeeBreakdownType, FeeGroup } from '@api/fees/fee.schema';
import { IFeesBreakdown } from '@api/tools/banks/banks.interface';
import { TransactionMode, TransactionProcessor } from '@api/transactions/transactions.enums';
import { AccountCurrency, AccountStatus } from '@api/account/account.enums';
import { AccountService } from '@api/account/account.service';
import { PaymentStatus, PaymentType, PaymentMethod, EnvoyPaymentAction, PaymentTimelineAction } from './payment.enums';
import { ExecutionOptions } from '@common/interfaces';
import * as puppeteer from 'puppeteer';
import { format, utcToZonedTime } from 'date-fns-tz';
import { ConfigService } from '@config/config.service';
import { Account } from '@api/account/accounts.schema';
import { WebhookEventTypes } from '@api/webhooks/webhook.enums';
import { EventService } from '@api/events/events.service';
import { GetTagModel, ModelIdTag, ParseTagId, TagMap, TagMongoId } from '@core/mongo';
import { transactionCurrencyCompare } from '@api/balance/balance.utils';
import { IEnvoyPaymentResponse } from './payment.interface';
import { PaymentException } from './payment.exception';

const TRANSACTION_PDF_TEMPLATE_BASE = 'file:///usr/src/app/src/transactions-pdf';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class PaymentService {
    public repo: Repository<Payment>;

    constructor(
        @Inject(REQUEST) protected request: TenantRequestPayload,
        private envoy: EnvoyService,
        private moduleRef: ModuleRef,
        private customerService: CustomerService,
        protected accountService: AccountService,
        protected eventService: EventService,
        private config: ConfigService,
    ) {
        const model = this.moduleRef.get(getModelToken(Payment.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<Payment>(model);
    }

    async findByIdOrReference(businessId: Types.ObjectId, id: string, query?: APIPagingDto) {
        const paymentId = ParseTagId(id, [ModelIdTag.Payment]);
        if (paymentId) {
            return this.repo.findOneWithOptions({
                conditions: { _id: paymentId, business: businessId },
                expand: query?.expand,
                select: query?.select,
            });
        }

        return this.repo.findOneWithOptions({
            conditions: { reference: id, business: businessId },
            expand: query?.expand,
            select: query?.select,
        });
    }

    /**
     * @deprecated
     * @param businessId
     * @param id
     * @param options
     */
    public async resendPaymentCompletedEvent(businessId: Types.ObjectId, id: string, options: ExecutionOptions) {
        const payment = await this.findByIdOrReference(businessId, id);

        await this.eventService.retryEventBySourceAndType(
            payment.business,
            payment.id,
            WebhookEventTypes.PaymentCompleted,
            options,
        );
    }

    public async requeue(businessId: Types.ObjectId, id: string, options: ExecutionOptions) {
        const payment = await this.findByIdOrReference(businessId, id);

        if (payment.status == PaymentStatus.Success || payment.status == PaymentStatus.Failed) {
            return this.eventService.retryEventBySourceAndType(
                payment.business,
                payment.id,
                WebhookEventTypes.PaymentCompleted,
                options,
            );
        }

        if (!options?.dryRun) {
            if (payment.status == PaymentStatus.New) {
                // TODO: Uncomment this line after implementing the balance log hash check
                // await this.sendPaymentEvent(payment);
                // throw PaymentException.CannotRequeuePayment;
            } else {
                await this.sendPaymentBacklogEvent(payment);
            }
        }
    }

    async getCustomer(business: HydratedDocument<Business>, fundingSource: IFundingSource, customerId?: string) {
        customerId = fundingSource.account.customer?.toString() ?? customerId;
        if (customerId) {
            return this.customerService.fetchCustomer(business.id, customerId);
        }

        return null;
    }

    async getFundingSource(
        business: HydratedDocument<Business>,
        source: TagMap,
        currency: AccountCurrency,
    ): Promise<IFundingSource> {
        if (source.tag === ModelIdTag.Account) {
            return this.getAccountFundingSource(business, source.id, currency);
        }

        throw PaymentException.InvalidFundingSource;
    }

    async getAccountFundingSource(
        business: HydratedDocument<Business>,
        id: Types.ObjectId,
        currency: AccountCurrency,
    ): Promise<IFundingSource> {
        const account = await this.accountService.repo.findOne({
            _id: id,
            business: business.id,
        });

        if (!account) {
            throw PaymentException.InvalidFundingSource;
        }

        if (account.status !== AccountStatus.Active) {
            throw PaymentException.FundingSourceNotActive;
        }

        if (account.currency !== currency) {
            throw PaymentException.FundingSourceCurrencyMismatch;
        }

        return {
            id: id,
            ref: GetTagModel(ModelIdTag.Account),
            account,
        };
    }

    async processPayment(
        payment: HydratedDocument<Payment>,
        options?: ExecutionOptions,
    ): Promise<HydratedDocument<Payment>> {
        if (payment.status !== PaymentStatus.New) {
            throw PaymentException.CannotRequeuePayment;
        }
        const newStatus = PaymentStatus.Queued;
        const timeline = {
            action: PaymentTimelineAction.Initiated,
            status: newStatus,
            createdAt: new Date(),
        };
        await this.repo.updateById(payment.id, { $set: { status: newStatus }, $push: { timeline } }, options);

        await this.sendToEnvoySync(payment, options);
        return this.repo.findOneById(payment.id);
    }

    async reversePayment(
        payment: HydratedDocument<Payment>,
        options?: ExecutionOptions,
    ): Promise<HydratedDocument<Payment>> {
        if (payment.status !== PaymentStatus.Success) {
            throw PaymentException.CannotReversePayment;
        }

        const newStatus = PaymentStatus.Queued;
        const timeline = {
            action: PaymentTimelineAction.SentForReversal,
            status: newStatus,
            createdAt: new Date(),
        };
        await this.repo.updateById(payment.id, { $set: { status: newStatus }, $push: { timeline } }, options);

        await this.sendToEnvoySync(payment, options);
        return this.repo.findOneById(payment.id);
    }

    async sendToEnvoy(payment: HydratedDocument<Payment>, options?: ExecutionOptions) {
        if (options?.dryRun) {
            return;
        }

        const payload = {
            action: EnvoyPaymentAction.ProcessPayment,
            payment: TagMongoId(ModelIdTag.Payment, payment.id),
        };

        return this.envoy.dispatch(EnvoyEvent.newPayment(GetTenantDataSource(this.request), payload));
    }

    async sendToEnvoySync<T>(
        payment: HydratedDocument<Payment>,
        options?: ExecutionOptions,
    ): Promise<IEnvoyPaymentResponse> {
        if (options?.dryRun) {
            return { status: 'success' };
        }

        const payload = {
            action: EnvoyPaymentAction.ProcessPayment,
            payment: TagMongoId(ModelIdTag.Payment, payment.id),
        };

        const envoyEvent = await this.envoy.dispatchSync<T>(
            EnvoyEvent.newPayment(GetTenantDataSource(this.request), payload),
        );

        return envoyEvent?.payload as IEnvoyPaymentResponse;
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

    async sendPaymentBacklogEvent(payment: HydratedDocument<Payment>, options?: ExecutionOptions) {
        if (options?.dryRun) {
            return;
        }

        const payload = {
            payment: TagMongoId(ModelIdTag.Payment, payment.id),
        };

        return this.envoy.dispatch(EnvoyEvent.newPaymentBacklog(GetTenantDataSource(this.request), payload));
    }

    async generatePDF(businessId: Types.ObjectId, id: string, timeZone = 'Etc/UTC'): Promise<[Buffer, string]> {
        const payment = await this.findByIdOrReference(businessId, id, {});
        const account = await this.accountService.repo.findOne({
            _id: payment.account,
            business: businessId,
        });
        const paymentId = TagMongoId(ModelIdTag.Payment, payment.id);

        const browser = await puppeteer.connect({
            browserWSEndpoint: this.config.BROWSERLESS_WS_URL,
        });
        const page = await browser.newPage();

        const zonedDate = utcToZonedTime(payment.createdAt, timeZone);
        const [data, template] = await this.getPDFData(payment, account, paymentId, zonedDate);

        const query = new URLSearchParams(data).toString();

        const url = `${template}?${query}`;

        page.goto(url);

        await page.waitForSelector('#dataWrapper');

        const buffer = await page.pdf({ printBackground: true });
        const fileName = `hyphen-receipt-${paymentId}-${format(zonedDate, 'yyyy-MM-dd')}.pdf`;

        return [buffer, fileName];
    }

    async getPDFData(
        payment: HydratedDocument<Payment>,
        account: HydratedDocument<Account>,
        reference: string,
        zonedDate: Date,
    ) {
        let template = `${TRANSACTION_PDF_TEMPLATE_BASE}/index.html`;
        let data = {
            type: Utils.toTitleCase(payment.type.replace('-', ' ')),
            mode: payment.type == PaymentType.PayIn ? TransactionMode.Credit : TransactionMode.Debit,
            amount: Utils.parseInt64ToCurrency(payment.amount, payment.currency),
            fees: Utils.parseInt64ToCurrency(payment.fees, payment.currency),
            amountAndFees: Utils.parseInt64ToCurrency(payment.amount + payment.fees, payment.currency),
            reference: reference,

            status: payment.status,
            date: format(zonedDate, 'eeee, d MMMM yyyy, hh:mm aaa'),
        };

        if (payment.method === PaymentMethod.BankTransfer) {
            template = `${TRANSACTION_PDF_TEMPLATE_BASE}/transfer.html`;

            data = {
                ...data,
                senderName: account.name,
                narration: payment.methodData.bankTransfer.narration,
                beneficiaryAccountNumber: payment.methodData.bankTransfer.accountNumber,
                beneficiaryName: payment.methodData.bankTransfer.accountName,
                beneficiaryBankName: payment.methodData.bankTransfer.bankName,
            } as any;
        }

        if (payment.type === PaymentType.PayIn) {
            template = `${TRANSACTION_PDF_TEMPLATE_BASE}/account-funding.html`;
            const settledAmount = Utils.parseInt64ToCurrency(payment.amount - payment.fees, payment.currency);
            data = { ...data, settledAmount } as any;

            if (payment.feesBreakdown && Array.isArray(payment.feesBreakdown)) {
                const vat = payment.feesBreakdown.find((v) => v.type == FeeBreakdownType.Vat);
                const emtl = payment.feesBreakdown.find((v) => v.type == FeeBreakdownType.Emtl);
                const vatFees = vat ? Utils.parseInt64ToCurrency(vat.amount, payment.currency) : null;
                const emtlFees = emtl ? Utils.parseInt64ToCurrency(emtl.amount, payment.currency) : null;

                data = { ...data, vatFees, emtlFees } as any;
            }
        }

        return [data, template];
    }
}

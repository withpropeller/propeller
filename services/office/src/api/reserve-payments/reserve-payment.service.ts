import { Inject, Injectable, Scope } from '@nestjs/common';
import { ModuleRef, REQUEST } from '@nestjs/core';
import { GetTenantDataSource, ModelIdTag, TagMongoId, TenantRequestPayload, Utils } from '@core/helpers';
import { HydratedDocument, Types } from 'mongoose';
import { AppException } from '@core/exceptions';
import { TransactionCurrency, TransactionProcessor } from '@api/transactions/transactions.enums';
import { PayoutPaymentMethod, PaymentType, PaymentStatus } from '../payments/payment.enums';
import { EnvoyEvent, EnvoyService } from '@common/envoy';
import { Admin } from '@api/admins/admin.schema';
import { CreatePayoutPaymentDto } from './reserve-payment.dto';
import { ITransferBreakdown } from '@api/tools/banks/banks.interface';
import { ExecutionOptions } from '@common/interfaces/execution.options';
import { AdminService } from '@api/admins/admin.service';
import { PaymentException } from '../payments/payment.exception';
import { Request } from 'express';
import { AccountStatus } from '@api/account/account.enums';
import { TransferService } from '@api/tools/banks/banks.service';
import { ReservePayment } from './reserve-payments.schema';
import { Repository, RepositoryFactory } from '@core/abstracts';
import { getModelToken } from '@nestjs/mongoose';
import { AdminAuditService } from '@api/audit/admin-audit.service';
import { ReserveAccount } from '@api/reserve-accounts/reserve-accounts.schema';
import { subMinutes } from 'date-fns';
import { accountCurrencyCompare, toTransactionCurrency } from '@api/balance/balance.utils';
import { SettlementAccount } from '@api/settlement-accounts/settlement-account.schema';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class ReservePaymentService {
    public repo: Repository<ReservePayment>;
    public reserveAccountRepo: Repository<ReserveAccount>;

    constructor(
        @Inject(REQUEST) private request: TenantRequestPayload,
        private envoy: EnvoyService,
        moduleRef: ModuleRef,
        private adminService: AdminService,
        private auditService: AdminAuditService,
        private transferService: TransferService,
    ) {
        const model = moduleRef.get(getModelToken(ReservePayment.name, GetTenantDataSource(request)), {
            strict: false,
        });
        const reserveAccountModel = moduleRef.get(getModelToken(ReserveAccount.name, GetTenantDataSource(request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<ReservePayment>(model);
        this.reserveAccountRepo = RepositoryFactory<ReserveAccount>(reserveAccountModel);
    }

    async create(adminId: Types.ObjectId, data: CreatePayoutPaymentDto, options: ExecutionOptions, req: Request) {
        const admin = await this.adminService.findById(adminId);

        // make sure we have a payment method
        if (!data.options.method) {
            throw AppException.BadRequest.setMessage('Payment method is required');
        }

        if (data.options.method == PayoutPaymentMethod.BankTransfer) {
            return this.createBankTransfer(admin, data, options, req);
        }
    }

    async createBankTransfer(
        admin: HydratedDocument<Admin>,
        data: CreatePayoutPaymentDto,
        options: ExecutionOptions,
        req: Request,
    ) {
        // Check if similar payment in the last 5 minutes exists to prevent duplicate payments
        const recentPayment = await this.repo.findOne(
            {
                type: PaymentType.PayOut,
                amount: data.amount,
                'methodData.bankTransfer.accountNumber': data.options.accountNumber,
                createdAt: { $gte: subMinutes(new Date(), 5) },
            },
            true,
            'id',
        );
        if (recentPayment) {
            throw PaymentException.DuplicatePayment;
        }

        // get bank details
        const bank = await this.transferService.getBankWithCode(data.options.bankCode);
        if (!bank) {
            throw PaymentException.InvalidBankCode;
        }

        // get breakdown
        const breakdown = await this.getBankTransferFeeBreakdown(data);

        // Get the payout account & funding source
        const debitSource = await this.getReserveAccount(data.debitSource.id, data.currency);

        const entity = {
            type: PaymentType.PayOut,
            processor: TransactionProcessor.Providus,
            admin: admin?.id,
            amount: data.amount,
            fees: breakdown.totalFees,
            feesBreakdown: breakdown.feesBreakdown,
            currency: data.currency,
            account: debitSource.id,
            method: data.options.method,
            methodData: {
                bankTransfer: {
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
                await this.sendReservePaymentEvent(payment);
                await this.auditService.registerPaymentReserve(payment.id, admin, req);
            }

            return payment;
        } catch (err) {
            throw AppException.ServiceUnavailable.setError(err);
        }
    }

    async createSettlementTransfer(
        admin: HydratedDocument<Admin>,
        reserveAccount: HydratedDocument<ReserveAccount>,
        settlementAccount: HydratedDocument<SettlementAccount>,
        amount: number,
        options: ExecutionOptions,
        req: Request,
    ) {
        const entity = {
            type: PaymentType.PayOut,
            processor: TransactionProcessor.Providus,
            admin: admin?.id,
            amount: amount,
            fees: 0,
            feesBreakdown: [],
            currency: toTransactionCurrency(reserveAccount.currency),
            account: reserveAccount.id,
            method: PayoutPaymentMethod.BankTransfer,
            methodData: {
                bankTransfer: {
                    accountNumber: settlementAccount.depositChannels[0].accountNumber,
                    accountName: settlementAccount.depositChannels[0].accountName,
                    narration: `Settlement Transfer to ${settlementAccount.name}`,
                    bankCode: settlementAccount.depositChannels[0].bankCode,
                    bankName: settlementAccount.depositChannels[0].bankName,
                },
            },
        };

        try {
            const payment = await this.repo.createAndSave(entity, options);

            // create and send the envoy event
            if (!options?.dryRun) {
                await this.sendReservePaymentEvent(payment);
                await this.auditService.registerPaymentReserve(payment.id, admin, req);
            }

            return payment;
        } catch (err) {
            throw AppException.ServiceUnavailable.setError(err);
        }
    }

    async getReserveAccount(
        id: Types.ObjectId,
        currency: TransactionCurrency,
    ): Promise<HydratedDocument<ReserveAccount>> {
        const account = await this.reserveAccountRepo.findById(id);
        if (!account) {
            throw PaymentException.InvalidFundingSource;
        }

        if (account.status !== AccountStatus.Active) {
            throw PaymentException.FundingSourceNotActive;
        }

        if (!accountCurrencyCompare(account.currency, currency)) {
            throw PaymentException.FundingSourceCurrencyMismatch;
        }

        return account;
    }

    async requeue(adminId: Types.ObjectId, paymentId: Types.ObjectId, options: ExecutionOptions, req: Request) {
        const admin = await this.adminService.findById(adminId);
        const payment = await this.repo.findOne({ _id: paymentId });
        if (payment.status == PaymentStatus.Success || payment.status == PaymentStatus.Failed) {
            throw PaymentException.CannotRequeuePayment;
        }

        if (!options?.dryRun) {
            if (payment.status == PaymentStatus.New) {
                await this.sendReservePaymentEvent(payment);
            } else {
                await this.sendReservePaymentBacklogEvent(payment);
            }
            await this.auditService.registerPaymentReserveRequeue(payment.id, admin, req);
        }
    }

    async validate(adminId: Types.ObjectId, paymentId: Types.ObjectId, options: ExecutionOptions, req: Request) {
        const admin = await this.adminService.findById(adminId);
        const payment = await this.repo.findOne({ _id: paymentId });

        await this.repo.updateById(payment.id, { $set: { validated: true } }, options);
        await this.auditService.registerPaymentValidate(payment.id, admin, req, options);
    }

    async fetchProcessorStatus(paymentId: Types.ObjectId) {
        const payment = await this.repo.findOne({ _id: paymentId });
        if (payment.method == PayoutPaymentMethod.BankTransfer) {
            return this.transferService.getTransferStatus(GetTenantDataSource(this.request), payment as any);
        }

        throw PaymentException.MethodNotSupported;
    }

    private async getBankTransferFeeBreakdown(data: CreatePayoutPaymentDto): Promise<ITransferBreakdown> {
        return this.transferService.getTransferBreakdown(
            data.options.bankCode,
            data.options.accountNumber,
            Utils.safeNumber(data.amount),
        );
    }

    async sendReservePaymentEvent(payment: HydratedDocument<ReservePayment>) {
        const payload = {
            action: 'process-reserve-payment',
            reservePayment: TagMongoId(ModelIdTag.ReservePayment, payment.id),
        };

        return this.envoy.dispatch(EnvoyEvent.newPayment(GetTenantDataSource(this.request), payload));
    }

    async sendReservePaymentBacklogEvent(payment: HydratedDocument<ReservePayment>) {
        const payload = {
            action: 'process-reserve-payment',
            reservePayment: TagMongoId(ModelIdTag.ReservePayment, payment.id),
        };

        return this.envoy.dispatch(EnvoyEvent.newPaymentBacklog(GetTenantDataSource(this.request), payload));
    }
}

import { Inject, Injectable, Scope } from '@nestjs/common';
import { ModuleRef, REQUEST } from '@nestjs/core';
import { InjectModel, getModelToken } from '@nestjs/mongoose';
import { Repository, RepositoryFactory } from '@core/abstracts';
import { TenantRequestPayload, GetTenantDataSource } from '@core/helpers/tenant-context-id.strategy';
import { Payment } from './payment.schema';
import { AppStatus, ModelIdTag, TagMongoId, TenantDataSource, Utils } from '@core/helpers';
import { APIPagingDto } from '@common/api-paging';
import { HydratedDocument, Model, Types } from 'mongoose';
import { EnvoyEvent, EnvoyService } from '@common/envoy';
import { Card } from '@api/cards/cards.schema';
import { TransactionCurrency, TransactionProcessor } from '@api/transactions/transactions.enums';
import { ExecutionOptions } from '@common/interfaces';
import { AppException } from '@core/exceptions';
import { ForceChargeDto, UpdateProcessorDataDto } from './payment.dto';
import { MetricsQueryDto } from '@common/dtos';
import { PaymentStatus, PaymentTimelineAction, PaymentType, PayoutPaymentMethod } from './payment.enums';
import { PaymentException } from './payment.exception';
import { AdminService } from '@api/admins/admin.service';
import { Request } from 'express';
import { AdminAuditService } from '@api/audit/admin-audit.service';
import { Business } from '@api/business/business.schema';
import { TransferService } from '@api/tools/banks/banks.service';
import { Admin } from '@api/admins/admin.schema';
import { ProvipayService } from '@common/integrations/provipay.service';
import { Billing } from '@api/billing/billing.schema';
import { Account } from '@api/account/accounts.schema';
import { FxService } from '@api/tools/fx/fx.service';
import { FxQuoteType } from '@api/tools/fx/fx.interface';
import { toTransactionCurrency } from '@api/balance/balance.utils';
import { isMarkedAsDebited } from './payment.utils';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class PaymentService {
    public repo: Repository<Payment>;
    public cardRepo: Repository<Card>;

    constructor(
        @Inject(REQUEST) protected request: TenantRequestPayload,
        private envoy: EnvoyService,
        private moduleRef: ModuleRef,
        protected adminService: AdminService,
        protected auditService: AdminAuditService,
        private transferService: TransferService,
        private provipayService: ProvipayService,
        private fxService: FxService,
        @InjectModel(Business.name, TenantDataSource.Core)
        private businessModel: Model<HydratedDocument<Business>>,
    ) {
        const model = this.moduleRef.get(getModelToken(Payment.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        const cardModel = this.moduleRef.get(getModelToken(Card.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<Payment>(model, { searchFields: ['reference'] });
        this.cardRepo = RepositoryFactory<Card>(cardModel);
    }

    getAll(query: APIPagingDto) {
        return this.repo.findByQuery(query, {}, [], [{ path: 'business', model: this.businessModel }]);
    }

    async getMetrics(query: MetricsQueryDto) {
        const matchStage: Record<string, any> = {};
        if (query.from || query.to) {
            matchStage.createdAt = {};
            if (query.from) matchStage.createdAt.$gte = new Date(query.from);
            if (query.to) matchStage.createdAt.$lte = new Date(query.to);
        }

        const [result] = await this.repo.aggregate([
            ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
            {
                $facet: {
                    byStatus: [
                        { $group: { _id: '$status', count: { $sum: 1 } } },
                        { $match: { _id: { $ne: null } } },
                        { $sort: { _id: 1 } },
                    ],
                    byType: [
                        { $group: { _id: '$type', count: { $sum: 1 } } },
                        { $match: { _id: { $ne: null } } },
                        { $sort: { _id: 1 } },
                    ],
                    byCurrency: [
                        {
                            $group: {
                                _id: '$currency',
                                totalAmount: { $sum: '$amount' },
                                count: { $sum: 1 },
                            },
                        },
                        { $sort: { _id: 1 } },
                    ],
                    total: [{ $count: 'count' }],
                },
            },
            {
                $project: {
                    byStatus: {
                        $arrayToObject: {
                            $map: { input: '$byStatus', as: 'v', in: { k: '$$v._id', v: '$$v.count' } },
                        },
                    },
                    byType: {
                        $arrayToObject: {
                            $map: { input: '$byType', as: 'v', in: { k: '$$v._id', v: '$$v.count' } },
                        },
                    },
                    byCurrency: '$byCurrency',
                    total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
                },
            },
        ]);

        return result ?? { byStatus: {}, byType: {}, byCurrency: [], total: 0 };
    }

    getOne(id: Types.ObjectId, query: APIPagingDto) {
        return this.repo.findOneWithOptions({
            conditions: { _id: id },
            select: query.select,
            expand: query.expand,
            populate: [{ path: 'business', model: this.businessModel }],
        });
    }

    async forceCharge(
        adminId: Types.ObjectId,
        paymentId: Types.ObjectId,
        body: ForceChargeDto,
        options: ExecutionOptions,
        req: Request,
    ) {
        const admin = await this.adminService.findById(adminId);
        const payment = await this.repo.findOne({ _id: paymentId });

        if (!payment) {
            throw AppException.NotFound;
        }

        if (![PaymentType.PayIn, PaymentType.PayOut].includes(payment.type)) {
            throw PaymentException.CannotForceChargePayment;
        }

        if (payment.type == PaymentType.PayOut && payment.status != PaymentStatus.Failed) {
            throw PaymentException.CannotForceChargePayment;
        }

        if (payment.type == PaymentType.PayIn && payment.status != PaymentStatus.Success) {
            throw PaymentException.CannotForceChargePayment;
        }

        const entity = {
            type: PaymentType.Charge,
            processor: TransactionProcessor.Allawee,
            business: payment.business,
            customer: payment.customer,
            amount: payment.amount,
            fees: payment.fees,
            feesBreakdown: payment.feesBreakdown,
            currency: payment.currency,
            fundingSource: payment.fundingSource,
            fundingSourceRef: payment.fundingSourceRef,
            account: payment.account,
            method: PayoutPaymentMethod.ForceCharge,
            methodData: {
                forceCharge: {
                    for: payment.id,
                    forRef: 'Payment',
                    remarks: body.remarks,
                },
            },
        };

        try {
            const chargePayment = await this.repo.createAndSave(entity, options);

            // create and send the envoy event
            if (!options?.dryRun) {
                await this.sendPaymentEvent(chargePayment);
                await this.auditService.registerPaymentForceCharge(chargePayment.id, admin, req);
            }

            return chargePayment;
        } catch (err) {
            if (err instanceof AppException && err.getCode() === AppStatus.Conflict) {
                throw AppException.ReferenceConflict;
            }
            throw AppException.ServiceUnavailable.setError(err);
        }
    }

    async payinRefund(
        adminId: Types.ObjectId,
        paymentId: Types.ObjectId,
        body: ForceChargeDto,
        options: ExecutionOptions,
        req: Request,
    ) {
        const admin = await this.adminService.findById(adminId);
        const payment = await this.repo.findOne({ _id: paymentId });

        if (!payment) {
            throw AppException.NotFound;
        }

        if (![PaymentType.PayOut, PaymentType.Charge].includes(payment.type)) {
            throw PaymentException.PaymentNotRefundable;
        }

        if (payment.status != PaymentStatus.Success) {
            throw PaymentException.PaymentNotInFailedState;
        }

        const entity = {
            type: PaymentType.PayIn,
            processor: TransactionProcessor.Allawee,
            business: payment.business,
            customer: payment.customer,
            amount: payment.amount + payment.fees,
            fees: 0,
            currency: payment.currency,
            fundingSource: payment.fundingSource,
            fundingSourceRef: payment.fundingSourceRef,
            account: payment.account,
            method: PayoutPaymentMethod.Refund,
            methodData: {
                refund: {
                    for: payment.id,
                    forRef: 'Payment',
                    remarks: body.remarks,
                },
            },
        };

        try {
            const chargePayment = await this.repo.createAndSave(entity, options);

            // create and send the envoy event
            if (!options?.dryRun) {
                await this.sendPaymentEvent(payment);
                await this.auditService.registerPaymentRefund(chargePayment.id, admin, req);
            }

            return chargePayment;
        } catch (err) {
            if (err instanceof AppException && err.getCode() === AppStatus.Conflict) {
                throw AppException.ReferenceConflict;
            }
            throw AppException.ServiceUnavailable.setError(err);
        }
    }

    /**
     * Refund a disputed payment
     * @param admin
     * @param payment
     * @param options
     * @param req
     */
    async refundDispute(
        admin: HydratedDocument<Admin>,
        payment: HydratedDocument<Payment>,
        options: ExecutionOptions,
        req: Request,
    ) {
        if (!payment) {
            throw AppException.NotFound;
        }

        if (![PaymentType.PayOut, PaymentType.Charge].includes(payment.type)) {
            throw PaymentException.PaymentNotRefundable;
        }

        if (payment.status != PaymentStatus.Success) {
            throw PaymentException.PaymentNotInSuccessState;
        }

        const disputeId = TagMongoId(ModelIdTag.Dispute, payment.dispute);

        const entity = {
            type: PaymentType.PayIn,
            processor: TransactionProcessor.Allawee,
            business: payment.business,
            customer: payment.customer,
            amount: payment.amount + payment.fees,
            fees: 0,
            currency: payment.currency,
            fundingSource: payment.fundingSource,
            fundingSourceRef: payment.fundingSourceRef,
            account: payment.account,
            method: PayoutPaymentMethod.Refund,
            methodData: {
                refund: {
                    dispute: payment.dispute,
                    for: payment.id,
                    forRef: 'Payment',
                    remarks: 'Dispute Refund for ' + disputeId,
                },
            },
        };

        try {
            const refundPayment = await this.repo.createAndSave(entity, options);

            // create and send the envoy event
            if (!options?.dryRun) {
                await this.sendPaymentEvent(refundPayment);
                await this.auditService.registerPaymentRefund(refundPayment.id, admin, req);
            }

            return refundPayment;
        } catch (err) {
            if (err instanceof AppException && err.getCode() === AppStatus.Conflict) {
                throw AppException.ReferenceConflict;
            }
            throw AppException.ServiceUnavailable.setError(err);
        }
    }

    /**
     * Calculate the total amount to charge for billing
     * @param billing The billing document
     * @param billingAccount The account to charge from
     * @returns The amount to charge in NGN
     */
    private async calculateBillingTotalAmount(
        billing: HydratedDocument<Billing>,
        billingAccount: HydratedDocument<Account>,
    ): Promise<number> {
        // If currency is NGN, return the due amount directly
        if (billing.currency === TransactionCurrency.NGN) {
            return billing.dueAmount;
        }

        // If currency is USD, convert to NGN using FX service and return the amount in NGN
        if (billing.currency === TransactionCurrency.USD) {
            const fxQuote = await this.fxService.getFxQuote({
                from: billing.currency,
                to: toTransactionCurrency(billingAccount.currency),
                amount: billing.dueAmount,
                type: FxQuoteType.Sell,
            });
            return fxQuote.toAmount;
        }

        // For any other currency throw an error
        throw AppException.BadRequest.setMessage('Invalid currency');
    }

    async chargeBilling(
        admin: HydratedDocument<Admin>,
        billing: HydratedDocument<Billing>,
        billingAccount: HydratedDocument<Account>,
        req: Request,
        options?: ExecutionOptions,
    ) {
        const totalAmount = await this.calculateBillingTotalAmount(billing, billingAccount);

        const entity = {
            type: PaymentType.Charge,
            processor: TransactionProcessor.Allawee,
            business: billing.business,
            amount: totalAmount,
            fees: 0,
            status: PaymentStatus.Queued,
            currency: toTransactionCurrency(billingAccount.currency),
            account: billingAccount._id,
            fundingSource: billingAccount._id,
            fundingSourceRef: 'Account',
            method: PayoutPaymentMethod.BillingCharge,
            methodData: {
                billingCharge: {
                    billing: billing._id,
                },
            },
            timeline: [
                {
                    action: PaymentTimelineAction.Initiated,
                    status: PaymentStatus.Success,
                    createdAt: new Date(),
                },
            ],
        };

        try {
            const chargePayment = await this.repo.createAndSave(entity, options);

            // create and send the envoy event
            if (!options?.dryRun) {
                await this.sendPaymentEvent(chargePayment);
                await this.auditService.registerPaymentChargeBilling(billing._id, admin, req);
            }

            return chargePayment;
        } catch (err) {
            if (err instanceof AppException && err.getCode() === AppStatus.Conflict) {
                throw AppException.ReferenceConflict;
            }
            throw AppException.ServiceUnavailable.setError(err);
        }
    }

    async requeue(adminId: Types.ObjectId, paymentId: Types.ObjectId, options: ExecutionOptions, req: Request) {
        const admin = await this.adminService.findById(adminId);
        const payment = await this.repo.findOne({ _id: paymentId });

        if (payment.status == PaymentStatus.New) {
            await this.sendPaymentEvent(payment, options);
            await this.auditService.registerPaymentRequeue(payment.id, admin, req, options);
            return;
        }

        if (payment.status == PaymentStatus.Pending && isMarkedAsDebited(payment)) {
            await this.repo.updateById(payment.id, { $set: { status: PaymentStatus.Queued } }, options);
            await this.sendPaymentEvent(payment, options);
            await this.auditService.registerPaymentRequeue(payment.id, admin, req, options);
            return;
        }

        if (payment.status == PaymentStatus.Pending) {
            // await this.repo.updateById(payment.id, { $set: { status: PaymentStatus.Queued } }, options);
            // await this.sendPaymentEvent(payment, options);
            await this.sendPaymentBacklogEvent(payment, options);
            await this.auditService.registerPaymentRequeue(payment.id, admin, req, options);
            return;
        }

        if (payment.status == PaymentStatus.Success || payment.status == PaymentStatus.Failed) {
            await this.sendPaymentBacklogEvent(payment, options);
            await this.auditService.registerPaymentRequeue(payment.id, admin, req, options);
            return;
        }

        throw PaymentException.CannotRequeuePayment;
    }

    async updateProcessorData(
        adminId: Types.ObjectId,
        paymentId: Types.ObjectId,
        body: UpdateProcessorDataDto,
        req: Request,
        options: ExecutionOptions,
    ) {
        const admin = await this.adminService.findById(adminId);
        const payment = await this.repo.findOne({ _id: paymentId });

        const update = Utils.removeNilValues({
            'processorData.validated': body.validated,
            'processorData.markedAsNotFound': body.markedAsNotFound,
            'processorData.markedAsDebited': body.markedAsDebited,
            'processorData.markedAsReversed': body.markedAsReversed,
        });

        if (Object.keys(update).length === 0) {
            throw AppException.BadRequest.setMessage('No data to update');
        }

        await this.repo.updateById(payment.id, { $set: update }, options);
        await this.auditService.registerPaymentUpdateProcessorData(payment.id, admin, body, req, options);
    }

    async fetchProcessorStatus(paymentId: Types.ObjectId) {
        const payment = await this.repo.findOne({ _id: paymentId });
        if (payment.method == PayoutPaymentMethod.BankTransfer) {
            return this.transferService.getTransferStatus(GetTenantDataSource(this.request), payment);
        }
        if (payment.method == PayoutPaymentMethod.Billing) {
            return this.provipayService.getStatus(GetTenantDataSource(this.request), payment);
        }

        throw PaymentException.MethodNotSupported;
    }

    async sendPaymentEvent(payment: HydratedDocument<Payment>, options?: ExecutionOptions) {
        if (options?.dryRun) {
            return;
        }
        const payload = {
            payment: TagMongoId(ModelIdTag.Payment, payment.id),
        };

        return this.envoy.dispatch(EnvoyEvent.newPayment(GetTenantDataSource(this.request), payload));
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
}

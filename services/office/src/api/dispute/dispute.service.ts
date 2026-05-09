import { Repository, RepositoryFactory } from '@core/abstracts';
import { ModelIdTag, ModelRef, TagMongoId, TenantDataSource } from '@core/helpers';
import { TenantRequestPayload, GetTenantDataSource } from '@core/helpers/tenant-context-id.strategy';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST, ModuleRef } from '@nestjs/core';
import { InjectModel, getModelToken } from '@nestjs/mongoose';
import { ExecutionOptions } from '@common/interfaces';
import { Dispute, DisputeStatus, DisputeTimelineAction, DisputeTimelineActorType } from './dispute.schema';
import { UpdateDisputeDto } from './dispute.dto';
import { DisputeException } from './dispute.exception';
import { EnvoyEvent, EnvoyService } from '@common/envoy';
import { EventService } from '@api/events/events.service';
import { Event } from '@api/events/event.schema';
import { WebhookEventTypes } from '@api/webhooks/webhook.enums';
import { WebhookService } from '@api/webhooks/webhooks.service';
import { Webhook } from '@api/webhooks/webhooks.schema';
import { HydratedDocument, Model, Types } from 'mongoose';
import { StorageService } from '@common/services/storage.service';
import { APIPagingDto, MongoAPIPaging } from '@common/api-paging';
import { Business } from '@api/business/business.schema';
import { AdminAuditService } from '@api/audit/admin-audit.service';
import { AdminService } from '@api/admins/admin.service';
import { Request } from 'express';
import { CardTransactionService } from '@api/card-transactions/card-transaction.service';
import { CardAuthorizationService } from '@api/card-authorizations/card-authorization.service';
import { Admin } from '@api/admins/admin.schema';
import { PaymentService } from '@api/payments/payment.service';
import { stringify } from 'csv-stringify/sync';
import { format } from 'date-fns';
import { buildDisputeCVData, getDisputePipeline, getDisputeRefundReserveAccountSlug } from './dispute.utils';
import { ReserveAccountService, ReserveAccountSlugNGNVostro } from '@api/reserve-accounts';
import { MetricsQueryDto } from '@common/dtos';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class DisputeService {
    public repo: Repository<Dispute>;

    constructor(
        @Inject(REQUEST) private request: TenantRequestPayload,
        @InjectModel(Business.name, TenantDataSource.Core)
        private businessModel: Model<HydratedDocument<Business>>,
        private webhookService: WebhookService,
        private eventService: EventService,
        private storageService: StorageService,
        private envoy: EnvoyService,
        private adminService: AdminService,
        private auditService: AdminAuditService,
        private cardTxnService: CardTransactionService,
        private cardAuthService: CardAuthorizationService,
        private paymentService: PaymentService,
        private reserveAccountService: ReserveAccountService,
        private moduleRef: ModuleRef,
    ) {
        const model = this.moduleRef.get(getModelToken(Dispute.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<Dispute>(model, { searchFields: ['source'], refs: ['source'] });
    }

    getAll(query: APIPagingDto) {
        return this.repo.findByQuery(query, {}, [], [{ path: 'business', model: this.businessModel }]);
    }

    getOne(id: Types.ObjectId, query: APIPagingDto) {
        return this.repo.findOneWithOptions({
            conditions: { _id: id },
            select: query.select,
            expand: query.expand,
            populate: [{ path: 'business', model: this.businessModel }],
        });
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
                    byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
                    byReason: [{ $group: { _id: '$reason', count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
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
                    byReason: {
                        $arrayToObject: {
                            $map: { input: '$byReason', as: 'v', in: { k: '$$v._id', v: '$$v.count' } },
                        },
                    },
                    byCurrency: '$byCurrency',
                    total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
                },
            },
        ]);

        return result ?? { byStatus: {}, byReason: {}, byCurrency: [], total: 0 };
    }

    async update(
        adminId: Types.ObjectId,
        disputeId: Types.ObjectId,
        body: UpdateDisputeDto,
        options: ExecutionOptions,
        req: Request,
    ) {
        const admin = await this.adminService.findById(adminId);
        let dispute = await this.repo.findById(disputeId);

        const docs = await this.uploadDisputeDocs(dispute, body.documents ?? [], options);
        const timeline = {
            action: DisputeTimelineAction.Updated,
            actorType: DisputeTimelineActorType.System,
            admin: admin.id,
            text: body.text,
            documents: docs.length ? docs : undefined,
        };

        const status = DisputeStatus.UnderReview;
        dispute = await this.repo.findOneAndUpdate(
            { _id: dispute.id },
            { status, $addToSet: { timeline: timeline } },
            options,
        );

        if (!options?.dryRun) {
            await this.createAndSendWebhookEvent(dispute);
            await this.auditService.registerDisputeUpdate(dispute.id, admin, req, dispute.toJSON());
        }

        return dispute;
    }

    async close(
        adminId: Types.ObjectId,
        disputeId: Types.ObjectId,
        body: UpdateDisputeDto,
        options: ExecutionOptions,
        req: Request,
    ) {
        let dispute = await this.repo.findById(disputeId);

        if (![DisputeStatus.UnderReview].includes(dispute.status)) {
            throw DisputeException.InvalidDisputeStatus;
        }

        const admin = await this.adminService.findById(adminId);

        const docs = await this.uploadDisputeDocs(dispute, body.documents ?? [], options);
        const timeline = {
            action: DisputeTimelineAction.Closed,
            actorType: DisputeTimelineActorType.System,
            admin: admin.id,
            text: body.text,
            documents: docs.length ? docs : undefined,
        };

        dispute = await this.repo.findOneAndUpdate(
            { _id: dispute.id },
            {
                status: DisputeStatus.Closed,
                $addToSet: { timeline: timeline },
            },
            options,
        );

        if (!options?.dryRun) {
            await this.createAndSendWebhookEvent(dispute);
            await this.auditService.registerDisputeClose(dispute.id, admin, req, dispute.toJSON());
        }

        return dispute;
    }

    async resolve(
        adminId: Types.ObjectId,
        disputeId: Types.ObjectId,
        body: UpdateDisputeDto,
        options: ExecutionOptions,
        req: Request,
    ) {
        let dispute = await this.repo.findById(disputeId);

        if (![DisputeStatus.UnderReview].includes(dispute.status)) {
            throw DisputeException.InvalidDisputeStatus;
        }

        const admin = await this.adminService.findById(adminId);

        const docs = await this.uploadDisputeDocs(dispute, body.documents ?? [], options);
        const timeline = {
            action: DisputeTimelineAction.Resolved,
            actorType: DisputeTimelineActorType.System,
            admin: admin.id,
            text: body.text,
            documents: docs.length ? docs : undefined,
        };

        dispute = await this.repo.findOneAndUpdate(
            { _id: dispute.id },
            {
                status: DisputeStatus.Resolved,
                $addToSet: { timeline: timeline },
            },
            options,
        );

        if (!options?.dryRun) {
            await this.createAndSendWebhookEvent(dispute);
            await this.auditService.registerDisputeResolve(dispute.id, admin, req, dispute.toJSON());
        }

        return dispute;
    }

    async reopen(
        adminId: Types.ObjectId,
        disputeId: Types.ObjectId,
        body: UpdateDisputeDto,
        options: ExecutionOptions,
        req: Request,
    ) {
        let dispute = await this.repo.findById(disputeId);

        if (![DisputeStatus.Closed, DisputeStatus.Resolved].includes(dispute.status)) {
            throw DisputeException.InvalidDisputeStatus;
        }

        const admin = await this.adminService.findById(adminId);

        const docs = await this.uploadDisputeDocs(dispute, body.documents ?? [], options);
        const timeline = {
            action: DisputeTimelineAction.Reopened,
            actorType: DisputeTimelineActorType.System,
            admin: admin.id,
            text: body.text,
            documents: docs.length ? docs : undefined,
        };

        dispute = await this.repo.findOneAndUpdate(
            { _id: dispute.id },
            {
                status: DisputeStatus.UnderReview,
                $addToSet: { timeline: timeline },
            },
            options,
        );

        if (!options?.dryRun) {
            await this.createAndSendWebhookEvent(dispute);
            await this.auditService.registerDisputeResolve(dispute.id, admin, req, dispute.toJSON());
        }

        return dispute;
    }

    async createAndSendWebhookEvent(dispute: HydratedDocument<Dispute>) {
        const webhooks = await this.webhookService.repo.find({
            business: dispute.business,
            disabled: { $ne: true },
            events: { $in: [WebhookEventTypes.DisputeUpdated] },
        });

        const event = await this.eventService.repo.createAndSave({
            type: WebhookEventTypes.DisputeUpdated,
            body: dispute.toJSON(),
            source: dispute.id,
            sourceRef: ModelRef.Dispute,
            business: dispute.business,
        });

        // update the api log with the event id
        await this.repo.updateById(dispute.id, { $addToSet: { events: event.id } });

        for (const webhook of webhooks) {
            await this.sendWebhookEvent(webhook, event);
        }
    }

    async refund(
        adminId: Types.ObjectId,
        disputeId: Types.ObjectId,
        body: UpdateDisputeDto,
        options: ExecutionOptions,
        req: Request,
    ) {
        let dispute = await this.repo.findById(disputeId);

        if (dispute.status != DisputeStatus.UnderReview) {
            throw DisputeException.InvalidDisputeStatus;
        }

        // ensure enough balance for refund
        await this.ensureRefundBalanceSufficient(dispute);

        const admin = await this.adminService.findById(adminId);

        const docs = await this.uploadDisputeDocs(dispute, body.documents ?? [], options);
        const timeline = {
            action: DisputeTimelineAction.Resolved,
            actorType: DisputeTimelineActorType.System,
            admin: admin.id,
            text: body.text,
            documents: docs.length ? docs : undefined,
        };

        // perform refund
        await this.performRefund(admin, dispute, options, req);

        // update dispute status
        dispute = await this.repo.findOneAndUpdate(
            { _id: dispute.id },
            {
                status: DisputeStatus.Resolved,
                $addToSet: { timeline: timeline },
            },
            options,
        );

        if (!options?.dryRun) {
            await this.createAndSendWebhookEvent(dispute);
            await this.auditService.registerDisputeResolve(dispute.id, admin, req, dispute.toJSON());
        }

        return dispute;
    }

    private async uploadDisputeDocs(
        dispute: HydratedDocument<Dispute>,
        documents: string[],
        options: ExecutionOptions,
    ): Promise<string[]> {
        const docs = [];
        for (const url of documents) {
            const awsDoc = await this.storageService.uploadViaUrl(
                `dispute-docs/${dispute.business.toString()}`,
                url,
                options,
            );
            docs.push(awsDoc);
        }
        return docs;
    }

    private async ensureRefundBalanceSufficient(dispute: HydratedDocument<Dispute>) {
        const reserveSlug = getDisputeRefundReserveAccountSlug(dispute.sourceRef);
        if (reserveSlug == ReserveAccountSlugNGNVostro) {
            return;
        }

        const reserveAccount = await this.reserveAccountService.fetchBySlug(reserveSlug);
        const balance = await this.reserveAccountService.getBalance(reserveAccount.balance);
        if (balance.available < dispute.amount) {
            throw DisputeException.RefundBalanceInsufficient;
        }
    }

    async performRefund(
        admin: HydratedDocument<Admin>,
        dispute: HydratedDocument<Dispute>,
        options: ExecutionOptions,
        req: Request,
    ) {
        if (dispute.sourceRef === ModelRef.CardTransaction) {
            const txn = await this.cardTxnService.repo.findById(dispute.source);
            const auth = await this.cardAuthService.repo.findById(txn.authorization);
            return this.cardAuthService.refund(admin, auth, options, req);
        }

        if (dispute.sourceRef === ModelRef.CardAuthorization) {
            const auth = await this.cardAuthService.repo.findById(dispute.source);
            return this.cardAuthService.refund(admin, auth, options, req);
        }

        if (dispute.sourceRef === ModelRef.Payment) {
            const payment = await this.paymentService.repo.findById(dispute.source);
            return this.paymentService.refundDispute(admin, payment, options, req);
        }

        throw DisputeException.CannotRefundDispute;
    }

    async sendWebhookEvent(webhook: HydratedDocument<Webhook>, event: HydratedDocument<Event>) {
        const payload = {
            webhook: TagMongoId(ModelIdTag.Webhook, webhook.id),
            event: TagMongoId(ModelIdTag.Event, event.id),
        };

        return this.envoy.dispatch(EnvoyEvent.newWebhook(GetTenantDataSource(this.request), payload));
    }

    public async getCSV(query: APIPagingDto) {
        const { conditions } = MongoAPIPaging.getPagingConstraints(query);
        const pipeline = getDisputePipeline(conditions);
        const res = await this.repo.aggregate(pipeline);
        const entries = res.map((v) => buildDisputeCVData(v));

        const columns = [
            { key: 'id', header: 'ID' },
            { key: 'type', header: 'Type' },
            { key: 'status', header: 'Status' },
            { key: 'statusReason', header: 'Status Reason' },
            { key: 'channel', header: 'Channel' },
            { key: 'amount', header: 'Amount' },
            { key: 'amountMoney', header: 'Amount (in currency)' },
            { key: 'currency', header: 'Currency' },
            { key: 'stan', header: 'Stan' },
            { key: 'rrn', header: 'Rrn' },
            { key: 'maskedPan', header: 'Masked Pan' },
            { key: 'cardExpiry', header: 'Card Expiry' },
            { key: 'narration', header: 'Narration' },
            { key: 'terminalId', header: 'Terminal ID' },
            { key: 'sessionId', header: 'Session ID' },
            { key: 'txTime', header: 'Txn Time (UTC)' },
            { key: 'createdAt', header: 'Created At (UTC)' },
        ];

        const csv = stringify(entries, { header: true, columns, quoted_string: true });
        const fileName = `alw-dispute-generated-${format(new Date(), 'yyyy-MM-dd')}.csv`;

        return [csv, fileName];
    }
}

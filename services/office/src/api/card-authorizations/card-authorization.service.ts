import { Inject, Injectable, Scope } from '@nestjs/common';
import { ModuleRef, REQUEST } from '@nestjs/core';
import { InjectModel, getModelToken } from '@nestjs/mongoose';
import { Repository, RepositoryFactory } from '@core/abstracts';
import { TenantRequestPayload, GetTenantDataSource } from '@core/helpers/tenant-context-id.strategy';
import { CardAuthorization, CardAuthorizationStatus, CardAuthorizationType } from './card-authorization.schema';
import { AdminAuditService } from '@api/audit/admin-audit.service';
import { HydratedDocument, Model, Types } from 'mongoose';
import { TenantDataSource } from '@core/helpers';
import { AppException } from '@core/exceptions';
import { ConfigService } from '@config/config.service';
import { catchError, firstValueFrom } from 'rxjs';
import { RResponse, RequestService } from '@common/services';
import { HttpService } from '@nestjs/axios';
import { Request } from 'express';
import { ExecutionOptions } from '@common/interfaces';
import { APIPagingDto, MongoAPIPaging } from '@common/api-paging';
import { Business } from '@api/business/business.schema';
import { Admin } from '@api/admins/admin.schema';
import { CardProgramService } from '@api/card-program/card-program.service';
import { AccountService } from '@api/account/account.service';
import { AdminService } from '@api/admins/admin.service';
import { CardProgramPartner } from '@api/card-program/card-program.enums';
import {
    createInterswitchReversalMac,
    createInterswitchDisputeRefundRequestBody,
    createPavilionDisputeRefundRequestBody,
    createInterswitchDebitLienRequestBody,
    createInterswitchCaptureMac,
    createPavilionReversalRequestBody,
    createPavilionDebitLienRequestBody,
    buildAuthorizationCVData,
    getAuthorizationPipeline,
    hasFundsReversedTimeline,
} from './card-authorization.utils';
import { AESEncryption } from '@core/crypto/aes-gcm-encryption';
import { AxiosHeaders } from 'axios';
import { RSAEncryption } from '@core/crypto/rsa-encryption';
import { CardProgramFundingSourceType } from '@api/card-program/card-program.schema';
import { CardsService } from '@api/cards/cards.service';
import { format } from 'date-fns';
import { stringify } from 'csv-stringify/sync';
import { MetricsQueryDto } from '@common/dtos';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class CardAuthorizationService {
    public repo: Repository<CardAuthorization>;
    public requestService: RequestService;

    constructor(
        http: HttpService,
        @Inject(REQUEST) private request: TenantRequestPayload,
        @InjectModel(Business.name, TenantDataSource.Core)
        private businessModel: Model<HydratedDocument<Business>>,
        private moduleRef: ModuleRef,
        private auditService: AdminAuditService,
        private cardProgramService: CardProgramService,
        private cardService: CardsService,
        private config: ConfigService,
        private accountService: AccountService,
        private adminService: AdminService,
    ) {
        const model = this.moduleRef.get(getModelToken(CardAuthorization.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<CardAuthorization>(model, {
            searchFields: ['merchantDescriptor', 'networkData.reference', 'merchantId', 'cardLast4', 'stan', 'rrn'],
            refs: ['business', 'card', 'program'],
        });
        this.requestService = new RequestService(http, this.config.CARD_AUTH_URL(this.request));
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
                    byStatus: [
                        { $group: { _id: '$status', count: { $sum: 1 } } },
                        { $match: { _id: { $ne: null } } },
                        { $sort: { _id: 1 } },
                    ],
                    byDeclineReason: [
                        { $match: { declineReason: { $exists: true } } },
                        { $group: { _id: '$declineReason', count: { $sum: 1 } } },
                        { $match: { _id: { $ne: null } } },
                        { $sort: { count: -1 } },
                    ],
                    byType: [
                        { $group: { _id: '$type', count: { $sum: 1 } } },
                        { $match: { _id: { $ne: null } } },
                        { $sort: { _id: 1 } },
                    ],
                    byDecisionType: [
                        { $group: { _id: '$decisionType', count: { $sum: 1 } } },
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
                    byDeclineReason: {
                        $arrayToObject: {
                            $map: { input: '$byDeclineReason', as: 'v', in: { k: '$$v._id', v: '$$v.count' } },
                        },
                    },
                    byType: {
                        $arrayToObject: {
                            $map: { input: '$byType', as: 'v', in: { k: '$$v._id', v: '$$v.count' } },
                        },
                    },
                    byDecisionType: {
                        $arrayToObject: {
                            $map: { input: '$byDecisionType', as: 'v', in: { k: '$$v._id', v: '$$v.count' } },
                        },
                    },
                    byCurrency: '$byCurrency',
                    total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
                },
            },
        ]);

        return (
            result ?? { byStatus: {}, byDeclineReason: {}, byType: {}, byDecisionType: {}, byCurrency: [], total: 0 }
        );
    }

    public async getCSV(query: APIPagingDto) {
        const { conditions } = MongoAPIPaging.getPagingConstraints(query);
        const pipeline = getAuthorizationPipeline(conditions);
        const res = await this.repo.aggregate(pipeline);
        const entries = res.map((v) => buildAuthorizationCVData(v));

        const columns = [
            { key: 'id', header: 'ID' },
            { key: 'status', header: 'Status' },
            { key: 'channel', header: 'Channel' },
            { key: 'network', header: 'Network' },
            { key: 'amount', header: 'Amount' },
            { key: 'fees', header: 'Fees' },
            { key: 'amountMoney', header: 'Amount' },
            { key: 'feesMoney', header: 'Fees' },
            { key: 'type', header: 'Type' },
            { key: 'currency', header: 'Currency' },
            { key: 'merchantId', header: 'Merchant ID' },
            { key: 'merchantDescriptor', header: 'Merchant Descriptor' },
            { key: 'stan', header: 'Stan' },
            { key: 'rrn', header: 'Rrn' },
            { key: 'cardId', header: 'Card ID' },
            { key: 'cardLast4', header: 'Card Last 4' },
            { key: 'txTime', header: 'Txn Time (UTC)' },
        ];

        const csv = stringify(entries, { header: true, columns, quoted_string: true });
        const fileName = `alw-authorization-generated-${format(new Date(), 'yyyy-MM-dd')}.csv`;

        return [csv, fileName];
    }

    async refund(
        admin: HydratedDocument<Admin>,
        auth: HydratedDocument<CardAuthorization>,
        options: ExecutionOptions,
        req: Request,
    ) {
        if (auth.type !== CardAuthorizationType.Capture) {
            throw AppException.BadRequest.setMessage('Unable to process refund, invalid authorization type');
        }

        if (auth.status !== CardAuthorizationStatus.Approved && auth.status !== CardAuthorizationStatus.Reversed) {
            throw AppException.BadRequest.setMessage('Unable to process refund, invalid authorization status');
        }

        if (auth.status == CardAuthorizationStatus.Reversed && hasFundsReversedTimeline(auth)) {
            throw AppException.BadRequest.setMessage('Unable to process refund, auth has been reversed');
        }

        if (auth.networkData.partner == CardProgramPartner.Interswitch) {
            return this.createAndSendInterswitchDisputeRefundReq(admin, auth, req, options);
        }

        if (auth.networkData.partner == CardProgramPartner.Providus) {
            return this.createAndSendProvidusDisputeRefundReq(admin, auth, req, options);
        }

        throw AppException.ServiceUnavailable.setMessage('Unable to process refund, invalid card program partner');
    }

    async bulkDebitLien(adminId: Types.ObjectId, query: APIPagingDto, req: Request) {
        const { conditions, limit } = MongoAPIPaging.getPagingConstraints(query, {
            status: CardAuthorizationStatus.Pending,
            'networkData.partner': CardProgramPartner.Interswitch,
        });

        const auths = await this.repo.findWithOptions({
            conditions: conditions,
            select: 'id',
            limit: limit,
        });

        for (const auth of auths) {
            try {
                await this.forceDebitLien(adminId, auth.id, req, { dryRun: query.dryRun });
            } catch (err) {}
        }
    }

    async forceDebitLien(adminId: Types.ObjectId, authId: Types.ObjectId, req: Request, options?: ExecutionOptions) {
        const auth = await this.repo.findById(authId);
        if (auth.type !== CardAuthorizationType.Capture) {
            throw AppException.BadRequest.setMessage('Unable to process force debit lien, invalid authorization type');
        }

        if (auth.status !== CardAuthorizationStatus.Pending) {
            throw AppException.BadRequest.setMessage(
                'Unable to process force debit lien, invalid authorization status',
            );
        }

        const validCardPrograms = [CardProgramPartner.Interswitch, CardProgramPartner.Providus];
        if (!validCardPrograms.includes(auth.networkData.partner as CardProgramPartner)) {
            throw AppException.BadRequest.setMessage(
                'Unable to process force debit lien, invalid card program partner',
            );
        }

        const admin = await this.adminService.findById(adminId);

        // debit lien on debit source
        if (auth.networkData.partner == CardProgramPartner.Providus) {
            await this.createAndSendProvidusForceDebitLienReq(auth, options);
        }

        if (auth.networkData.partner == CardProgramPartner.Interswitch) {
            await this.createAndSendInterswitchForceDebitLienReq(auth, options);
        }

        // register audit
        await this.auditService.registerCardAuthDebitLien(auth.id, admin, req, options);
    }

    async forceReversal(adminId: Types.ObjectId, authId: Types.ObjectId, req: Request, options?: ExecutionOptions) {
        const auth = await this.repo.findById(authId);
        if (auth.type !== CardAuthorizationType.Capture) {
            throw AppException.BadRequest.setMessage('Unable to process force debit lien, invalid authorization type');
        }

        if (auth.status !== CardAuthorizationStatus.Pending) {
            throw AppException.BadRequest.setMessage(
                'Unable to process force debit lien, invalid authorization status',
            );
        }

        if (auth.networkData.partner !== CardProgramPartner.Providus) {
            throw AppException.BadRequest.setMessage(
                'Unable to process force debit lien, invalid card program partner',
            );
        }

        const admin = await this.adminService.findById(adminId);

        // debit lien on debit source
        await this.createAndSendProvidusForceReversalReq(auth, options);

        // register audit
        await this.auditService.registerCardAuthForceReversal(auth.id, admin, req, options);
    }

    private async getCardAccount(auth: HydratedDocument<CardAuthorization>) {
        const cardProgram = await this.cardProgramService.repo.findById(auth.program);

        if (cardProgram.authorization.fundingSourceType == CardProgramFundingSourceType.SettlementAccount) {
            return this.accountService.repo.findById(cardProgram.authorization.settlementAccount);
        }

        const card = await this.cardService.repo.findById(auth.card);
        if (!card.fundingSource) {
            throw AppException.BadRequest.setMessage('Unable to process force debit lien, no funding source found');
        }
        return this.accountService.repo.findById(card.fundingSource);
    }

    private async createAndSendInterswitchDisputeRefundReq(
        admin: HydratedDocument<Admin>,
        auth: HydratedDocument<CardAuthorization>,
        req: Request,
        options: ExecutionOptions,
    ) {
        const body = createInterswitchDisputeRefundRequestBody(auth);
        const mac = await createInterswitchReversalMac(body, this.config.INTERSWITCH_SECRET_KEY);
        const response = await this.postInterswitch('/interswitch/cards/refund/dispute', { mac, ...body }, options);

        const data = response.data;
        if (data?.responseCode === '00' || data?.response_code === '00') {
            await this.auditService.registerCardAuthRefund(auth.id, admin, req, options);
            return;
        }

        throw AppException.ServiceUnavailable.setMessage('Unable to process refund, invalid response code');
    }

    private async createAndSendInterswitchForceDebitLienReq(
        auth: HydratedDocument<CardAuthorization>,
        options: ExecutionOptions,
    ) {
        const body = createInterswitchDebitLienRequestBody(auth);
        const mac = await createInterswitchCaptureMac(body, this.config.INTERSWITCH_SECRET_KEY);
        const response = await this.postInterswitch('/interswitch/cards/lien/debit', { mac, ...body }, options);

        const data = response.data;
        if (data?.responseCode === '00' || data?.response_code === '00') {
            return;
        }

        throw AppException.ServiceUnavailable.setMessage('Unable to process debit-lien, invalid response code');
    }

    private async createAndSendProvidusForceDebitLienReq(
        auth: HydratedDocument<CardAuthorization>,
        options: ExecutionOptions,
    ) {
        const body = createPavilionDebitLienRequestBody(auth);
        const response = await this.postPavilion('/providus/transaction/authorization', body, options);

        const data = response.data;
        if (data?.responseCode === '00' || data?.response_code === '00') {
            return;
        }

        throw AppException.ServiceUnavailable.setMessage('Unable to process refund, invalid response code');
    }

    private async createAndSendProvidusForceReversalReq(
        auth: HydratedDocument<CardAuthorization>,
        options: ExecutionOptions,
    ) {
        const body = createPavilionReversalRequestBody(auth);
        const response = await this.postPavilion('/providus/transaction/authorization', body, options);

        const data = response.data;
        if (data?.responseCode === '00' || data?.response_code === '00') {
            return;
        }

        throw AppException.ServiceUnavailable.setMessage('Unable to process refund, invalid response code');
    }

    private async createAndSendProvidusDisputeRefundReq(
        admin: HydratedDocument<Admin>,
        auth: HydratedDocument<CardAuthorization>,
        req: Request,
        options: ExecutionOptions,
    ) {
        const body = createPavilionDisputeRefundRequestBody(auth);
        const response = await this.postPavilion('/providus/transaction/authorization', body, options);

        if (response?.data?.responseCode === '00' || response?.data?.response_code === '00') {
            await this.auditService.registerCardAuthRefund(auth.id, admin, req, options);
            return;
        }

        throw AppException.ServiceUnavailable.setMessage('Unable to process refund, invalid response code');
    }

    postInterswitch(url: string, data?: any, options?: ExecutionOptions): Promise<RResponse> {
        if (options?.dryRun) {
            return;
        }
        return firstValueFrom(
            this.requestService.sendPostRequest(url, data).pipe(catchError(this.requestService.handleError())),
        );
    }

    async postPavilion(url: string, data: any, options?: ExecutionOptions): Promise<RResponse> {
        if (options?.dryRun) {
            return;
        }

        const [key, iv] = AESEncryption.getKeyIVPair();
        const encryptedData = AESEncryption.encrypt(JSON.stringify(data), key, iv).toString('hex');
        const headers = this.preparePavilionHeaders(key, iv);

        const res = await firstValueFrom(
            this.requestService
                .sendPostRequest(url, encryptedData, headers)
                .pipe(catchError(this.requestService.handleError())),
        );

        const decryptedData = AESEncryption.decrypt(Buffer.from(res.data, 'hex'), key, iv);
        res.data = JSON.parse(decryptedData);
        return res;
    }

    preparePavilionHeaders(key: Buffer, iv: Buffer): AxiosHeaders {
        const encodedKey = Buffer.from(key).toString('base64');
        const encodedIV = Buffer.from(iv).toString('base64');
        const encryption = new RSAEncryption(`/etc/secrets/${this.request.tenantId}-public.pem`);
        const sessionKey = encryption.encrypt(encodedKey).toString('hex');

        const headers = new AxiosHeaders();
        headers.set('Content-Type', 'text/plain');
        headers.set('X-SessionKey', sessionKey);
        headers.set('X-SessionIV', encodedIV);

        return headers;
    }
}

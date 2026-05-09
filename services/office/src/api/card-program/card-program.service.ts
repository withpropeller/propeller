import { Inject, Injectable, Scope } from '@nestjs/common';
import { InjectModel, getModelToken } from '@nestjs/mongoose';
import { AppStatus, TenantDataSource } from '@core/helpers/enums';
import { Repository, RepositoryFactory } from '@core/abstracts';
import { CardProgram } from '@api/card-program/card-program.schema';
import { HydratedDocument, Model, Types } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { CageService } from '@common/cage/cage.service';
import { HttpStatusCode } from 'axios';
import { AppException } from '@core/exceptions';
import { CardGeneratedData } from '@api/cards/cards.interface';
import { Card, CardDetails } from '@api/cards/cards.schema';
import { CardType } from '@api/cards/cards.enums';
import { CardProgramException } from '@api/card-program/card-program.exception';
import {
    CardProgramProductionInProgressStatuses,
    CardProgramGoLiveStatuses,
    CardProgramStatus,
    CardProgramApprovedStatuses,
    CardProgramPartner,
    CardProgramProfileCodes,
} from '@api/card-program/card-program.enums';
import { Logger } from '@nestjs/common';
import * as JSZip from 'jszip';
import { TransactionCurrency } from '@api/transactions/transactions.enums';
import { GetTenantDataSource, TenantRequestPayload } from '@core/helpers';
import { ModuleRef, REQUEST } from '@nestjs/core';
import { CardsService } from '@api/cards/cards.service';
import { AdminService } from '@api/admins/admin.service';
import { Request } from 'express';
import { AdminAuditService } from '@api/audit/admin-audit.service';
import { Business } from '@api/business/business.schema';
import { BusinessException } from '@api/business/business.exception';
import { BusinessStatus } from '@api/business/business.enums';
import { APIPagingDto } from '@common/api-paging';
import { ApproveCardProgramDto, CreateTestCardProgramDto, UpdateCardProgramStatuesDto } from './card-program.dto';
import { ExecutionOptions } from '@common/interfaces';
import { PavilionCard } from '@common/integrations/integrations.interfaces';
import { getCardProgramProfile } from './card-program.utils';
import { ConfigService } from '@config/config.service';
import { CardBinService } from '@api/card-bins/card-bin.service';
import { MetricsQueryDto } from '@common/dtos';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class CardProgramService {
    private readonly logger = new Logger(CardProgramService.name);
    private cageService: CageService;
    public repo: Repository<CardProgram>;

    constructor(
        private http: HttpService,
        private config: ConfigService,
        @Inject(REQUEST) private request: TenantRequestPayload,
        private cardsService: CardsService,
        private cardBinService: CardBinService,
        private adminService: AdminService,
        private auditService: AdminAuditService,
        private moduleRef: ModuleRef,
        @InjectModel(Business.name, TenantDataSource.Core)
        private businessModel: Model<HydratedDocument<Business>>,
    ) {
        const model = this.moduleRef.get(getModelToken(CardProgram.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<CardProgram>(model);
        this.cageService = new CageService(http, config);
    }

    getAll(query: APIPagingDto) {
        return this.repo.findByQuery(query, {}, [], [{ path: 'business', model: this.businessModel }]);
    }

    async getOne(id: Types.ObjectId, query: APIPagingDto) {
        return this.repo.findOneWithOptions({
            conditions: { _id: id },
            select: query.select,
            expand: query.expand,
            populate: [{ path: 'business', model: this.businessModel }],
        });
    }

    async createTest(
        adminId: Types.ObjectId,
        dto: CreateTestCardProgramDto,
        req: Request,
    ): Promise<HydratedDocument<CardProgram>> {
        const business = await this.businessModel.findById(dto.business);
        if (!business || business.status !== BusinessStatus.Approved) {
            throw BusinessException.BusinessNotApproved;
        }

        const bin = await this.cardBinService.repo.findOne({ _id: dto.bin });
        const network = bin.network;
        const partner = bin.config.partner as unknown as CardProgramPartner;
        const profile = getCardProgramProfile(GetTenantDataSource(this.request), partner, network);

        const entity: Partial<CardProgram> = {
            name: dto.name,
            description: dto.description,
            network,
            type: dto.type,
            quantity: dto.quantity,
            currency: dto.currency,
            business: dto.business,
            bin: dto.bin,
            status: CardProgramStatus.Approved,
            config: {
                partner,
                profile: profile.code,
                partnerProfile: bin.config.partnerProfile,
            } as any,
            personalization: {
                defaultCardholderName: 'TEST CARDHOLDER',
                printCardholderName: false,
            } as any,
            distribution: { type: 'individually' } as any,
            authorization: {} as any,
        };

        const program = await this.repo.createAndSave(entity);
        const admin = await this.adminService.findById(adminId);
        await this.auditService.registerCardProgramUpdate(program.id, admin, req, dto);
        return program;
    }

    async generate(adminId: Types.ObjectId, id: Types.ObjectId, req: Request) {
        if (GetTenantDataSource(this.request) != TenantDataSource.Live) {
            throw AppException.BadRequest.setMessage('Card generation is only available in live environment');
        }

        const admin = await this.adminService.findById(adminId);

        const cardProgram = await this.repo.findOne({ _id: id });

        if (CardProgramGoLiveStatuses.includes(cardProgram.status)) {
            throw CardProgramException.AlreadyWentLive;
        }

        if (CardProgramProductionInProgressStatuses.includes(cardProgram.status)) {
            throw CardProgramException.ProductionInProgress;
        }

        if (cardProgram.status !== CardProgramStatus.Approved) {
            throw CardProgramException.CardProgramNotApproved;
        }

        let numberOfCollisions = 0;
        let cycles = Math.floor(cardProgram.quantity / 100);
        let cardDetailsArr: CardDetails[] = [];

        do {
            let take: number;
            if (cycles > 0) {
                take = 100;
            } else if (cycles === 0) {
                take = cardProgram.quantity % 100;
            }

            if (numberOfCollisions + take > 0) {
                const [collisions, cardDetails] = await this.generateCards(cardProgram, numberOfCollisions + take);
                numberOfCollisions = collisions;
                cardDetailsArr = cardDetailsArr.concat(cardDetails);
            }

            cycles--;
        } while (numberOfCollisions > 0 || cycles >= 0);

        const response = await this.generateCardFiles(cardDetailsArr);

        await this.repo.updateOne({ _id: id }, { status: CardProgramStatus.Manufacturing });

        await this.auditService.registerCardProgramUpdate(cardProgram.id, admin, req, {
            status: CardProgramStatus.Manufacturing,
        });
        return response;
    }

    private async generateCardFiles(cardDetails: CardDetails[]) {
        const res = await this.cageService.post<CardGeneratedData>('/cards/card-files', {
            cardDetails: cardDetails,
        });

        const cardCSV = res.data.data.cardCsv;
        const accountCSV = res.data.data.accountCsv;
        const cardAccountCSV = res.data.data.cardAccountCsv;

        const zip = new JSZip();
        zip.file('cards.txt', cardCSV);
        zip.file('accounts.txt', accountCSV);
        zip.file('card_accounts.txt', cardAccountCSV);
        const buffer = await zip.generateAsync({ type: 'nodebuffer' });

        const fileName = 'card-files.zip';

        return [buffer, fileName] as any;
    }

    private async generateCards(
        cardProgram: HydratedDocument<CardProgram>,
        count: number,
    ): Promise<[number, CardDetails[]]> {
        const res = await this.cageService.post<CardDetails[]>('/cards/generate', {
            type: cardProgram.type,
            count,
            cardProfile: CardProgramProfileCodes.VerveLive,
            defaultCardHolderName: cardProgram.personalization.defaultCardholderName,
        });

        if (res.status !== HttpStatusCode.Ok || res.data.code !== AppStatus.Success) {
            this.logger.debug(res);
            throw AppException.ServiceUnavailable.setError(res.data.error);
        }

        const collisions = [];
        const generatedCardFiles = [];

        for (const details of res.data.data) {
            const card = await this.cardsService.repo.findOne(
                {
                    $or: [
                        { 'details.pan': details.pan },
                        { 'details.panHash': details.panHash },
                        { 'details.account': details.account },
                    ],
                },
                true,
            );

            if (card) {
                collisions.push(details);
                continue;
            }

            await this.cardsService.repo.createAndSave({
                business: cardProgram.business,
                program: cardProgram.id,
                type: CardType.Physical,
                network: cardProgram.network,
                currency: TransactionCurrency.NGN,
                details,
            });

            generatedCardFiles.push(details);
        }

        return [collisions.length, generatedCardFiles];
    }

    async approve(
        adminId: Types.ObjectId,
        id: Types.ObjectId,
        body: ApproveCardProgramDto,
        req: Request,
        options?: ExecutionOptions,
    ) {
        const admin = await this.adminService.findById(adminId);

        const cardProgram = await this.repo.findOne({ _id: id });

        if (CardProgramGoLiveStatuses.includes(cardProgram.status)) {
            throw CardProgramException.AlreadyWentLive;
        }

        if (CardProgramProductionInProgressStatuses.includes(cardProgram.status)) {
            throw CardProgramException.ProductionInProgress;
        }

        const profile = getCardProgramProfile(GetTenantDataSource(this.request), body.partner, cardProgram.network);

        await this.repo.updateOne(
            { _id: id },
            {
                status: CardProgramStatus.Approved,
                'config.partner': body.partner,
                'config.partnerProfile': body.partnerProfile,
                'config.profile': profile.code,
            } as any,
            options,
        );

        await this.auditService.registerCardProgramApprove(cardProgram.id, admin, req, body);
    }

    async personalise(
        adminId: Types.ObjectId,
        id: Types.ObjectId,
        body: UpdateCardProgramStatuesDto,
        req: Request,
        options?: ExecutionOptions,
    ) {
        const admin = await this.adminService.findById(adminId);

        const cardProgram = await this.repo.findOne({ _id: id });

        if (CardProgramGoLiveStatuses.includes(cardProgram.status)) {
            throw CardProgramException.AlreadyWentLive;
        }

        if (cardProgram.status != CardProgramStatus.Approved) {
            throw CardProgramException.CardProgramNotInApprovedState;
        }

        if (cardProgram.config.partner !== CardProgramPartner.Providus) {
            throw AppException.BadRequest.setMessage('Personalisation is only available for Providus');
        }

        console.log('===1 personalise');
        await this.requestCardBatches(cardProgram, options);
        await this.auditService.registerCardProgramUpdatePersonalise(cardProgram.id, admin, req, body);
    }

    async requestCardBatches(program: HydratedDocument<CardProgram>, options?: ExecutionOptions) {
        if (Array.isArray(program?.config.cardBatches) && program.config.cardBatches.length > 0) {
            throw AppException.BadRequest.setMessage('Card batches already requested');
        }
        console.log('===2 personalise');
        const cardBatches = await this.cardBinService.batchInstantCardRequest(program, options);

        const update = {
            $addToSet: { 'config.cardBatches': cardBatches },
            $set: { status: CardProgramStatus.Personalising },
        };
        return this.repo.updateOne({ _id: program._id }, update as any, options);
    }

    async unlinkCard(adminId: Types.ObjectId, cardId: Types.ObjectId, req: Request, options?: ExecutionOptions) {
        const admin = await this.adminService.findById(adminId);
        const card = await this.cardsService.repo.findOne({ _id: cardId });
        const cardProgram = await this.repo.findOne({ _id: card.program });

        if (cardProgram.config.partner == CardProgramPartner.Providus) {
            const res = await this.cardBinService.unlinkCard(cardProgram.bin, card.details.id, options);
            if (res.ResponseCode != '00' && res.ResponseCode != '01') {
                throw AppException.ServiceUnavailable.setError(res);
            }
        }

        const unsetData = { customer: card.customer, controls: card.controls };
        const update = {
            $set: { status: 'new' },
            $unset: {
                customer: '',
                controls: '',
                'details.panHash': '',
                'details.pan': '',
                'details.account': '',
                'details.expiry': '',
                'details.cvv': '',
            },
        };
        await this.cardsService.repo.updateById(card.id, update, options);

        await this.auditService.registerCardUnlink(card.id, admin, req, unsetData);
    }

    async unlinkProgramCards(adminId: Types.ObjectId, id: string, req: Request, options?: ExecutionOptions) {
        const admin = await this.adminService.findById(adminId);

        const cardProgram = await this.repo.findOne({ _id: id });
        const binService = await this.cardBinService.getBINServiceById(cardProgram.bin);

        if (cardProgram.status !== CardProgramStatus.Live) {
            throw CardProgramException.CardProgramNotLive;
        }

        const cards = await this.cardsService.repo.findWithOptions({
            conditions: { program: cardProgram.id, business: cardProgram.business },
        });

        for (const card of cards) {
            if (cardProgram.config.partner == CardProgramPartner.Providus) {
                const res = await binService.unlinkCard(card.details.id, options);
                if (res.ResponseCode != '00' && res.ResponseCode != '01') {
                    throw AppException.ServiceUnavailable.setError(res);
                }
            }

            const update = {
                $set: { status: 'new' },
                $unset: {
                    customer: '',
                    controls: '',
                    'details.panHash': '',
                    'details.pan': '',
                    'details.account': '',
                    'details.expiry': '',
                    'details.cvv': '',
                },
            };
            await this.cardsService.repo.updateById(card.id, update, options);
        }

        await this.auditService.registerCardProgramUnlink(cardProgram.id, admin, req);
    }

    async getCardStatus(cardId: Types.ObjectId) {
        const card = await this.cardsService.repo.findOne({ _id: cardId });
        const cardProgram = await this.repo.findOne({ _id: card.program });

        if (cardProgram.config.partner == CardProgramPartner.Providus) {
            return this.cardBinService.getCardStatus(cardProgram.bin, card.details.id);
        }

        throw AppException.BadRequest.setMessage('Getting card status is only available for Providus');
    }

    async getCardBatches(id: Types.ObjectId) {
        const program = await this.repo.findOne({ _id: id });
        if (program.config.partner !== CardProgramPartner.Providus) {
            throw AppException.BadRequest.setMessage('Getting card batch is only available for Providus');
        }

        const cardBatches = program.config.cardBatches;
        let pavilionCards: PavilionCard[] = [];

        const binService = await this.cardBinService.getBINServiceById(program.bin);
        for (const batch of cardBatches) {
            const batchCards = await binService.getCardsByBatchNumber(batch);
            pavilionCards = pavilionCards.concat(batchCards);
        }

        return {
            cardBatches,
            length: pavilionCards.length,
            cards: pavilionCards,
        };
    }

    async goLive(adminId: Types.ObjectId, id: Types.ObjectId, req: Request, options?: ExecutionOptions) {
        const admin = await this.adminService.findById(adminId);

        const cardProgram = await this.repo.findOne({ _id: id });

        if (CardProgramGoLiveStatuses.includes(cardProgram.status)) {
            throw CardProgramException.AlreadyWentLive;
        }

        if (!CardProgramApprovedStatuses.includes(cardProgram.status)) {
            throw CardProgramException.CardProgramNotApproved;
        }

        if (
            cardProgram.config.partner == CardProgramPartner.Providus &&
            (!Array.isArray(cardProgram.config.cardBatches) || cardProgram.config.cardBatches.length === 0)
        ) {
            throw CardProgramException.CardProgramNotPersonalized;
        }

        if (
            cardProgram.config.partner == CardProgramPartner.Providus &&
            Array.isArray(cardProgram.config.cardBatches) &&
            cardProgram.config.cardBatches.length > 0
        ) {
            await this.provisionInstantCards(cardProgram, options);
        }

        await this.repo.updateOne({ _id: id }, { status: CardProgramStatus.Live });

        await this.auditService.registerCardProgramGoLive(cardProgram.id, admin, req);
    }

    async provisionInstantCards(program: HydratedDocument<CardProgram>, options?: ExecutionOptions) {
        const cardBatches = program.config.cardBatches;
        let pavilionCards: PavilionCard[] = [];

        const binService = await this.cardBinService.getBINServiceById(program.bin);
        for (const batch of cardBatches) {
            const batchCards = await binService.getCardsByBatchNumber(batch);
            pavilionCards = pavilionCards.concat(batchCards);
        }

        if (pavilionCards.length !== program.quantity) {
            throw AppException.BadRequest.setMessage(
                'Card count mismatch, got ' + pavilionCards.length + ' expected ' + program.quantity,
            );
        }

        const entities: Partial<Card>[] = pavilionCards.map((card) => {
            return {
                business: program.business,
                program: program.id,
                type: CardType.Physical,
                network: program.network,
                currency: TransactionCurrency.NGN,
                details: {
                    id: card.Id,
                    cardHolderName: program.personalization.defaultCardholderName,
                    last4: card.MaskedPan.slice(-4),
                },
            };
        });

        await this.cardsService.repo.bulkInsert(entities, options);
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
                    byNetwork: [
                        { $group: { _id: '$network', count: { $sum: 1 } } },
                        { $match: { _id: { $ne: null } } },
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
                    byNetwork: {
                        $arrayToObject: {
                            $map: { input: '$byNetwork', as: 'v', in: { k: '$$v._id', v: '$$v.count' } },
                        },
                    },
                    total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
                },
            },
        ]);

        return result ?? { byStatus: {}, byNetwork: {}, total: 0 };
    }
}

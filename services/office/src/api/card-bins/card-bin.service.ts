import { Inject, Injectable, Scope } from '@nestjs/common';
import { ModuleRef, REQUEST } from '@nestjs/core';
import { getModelToken, InjectModel } from '@nestjs/mongoose';
import { Repository, RepositoryFactory } from '@core/abstracts';
import { TenantRequestPayload, GetTenantDataSource } from '@core/helpers/tenant-context-id.strategy';
import { CardBin, CardBinConfig } from './card-bin.schema';
import { HydratedDocument, Model, Types } from 'mongoose';
import { PavilionService } from '@common/integrations/pavilion.service';
import { RestUriCredentials } from '@config/uri-credential';
import { TenantDataSource } from '@core/helpers';
import { ConfigService } from '@config/config.service';
import { HttpService } from '@nestjs/axios';
import { CardProgram } from '@api/card-program/card-program.schema';
import { ExecutionOptions } from '@common/interfaces';
import { AxiosHeaders } from 'axios';
import { CreateCardBinDto } from './card-bin.dto';
import { calculateBin, calculateBinLength } from './card-bin.utils';
import { SCryptCryptoFactory } from '@core/crypto';
import { RSAEncryption } from '@core/crypto/rsa-encryption';
import { Business } from '@api/business/business.schema';
import { BusinessException } from '@api/business/business.exception';
import { BusinessStatus } from '@api/business/business.enums';
import { APIPagingDto } from '@common/api-paging';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class CardBinService {
    public repo: Repository<CardBin>;
    private encryption: RSAEncryption;

    constructor(
        @Inject(REQUEST) private request: TenantRequestPayload,
        @InjectModel(Business.name, TenantDataSource.Core) private businessModel: Model<HydratedDocument<Business>>,
        private moduleRef: ModuleRef,
        private config: ConfigService,
        private http: HttpService,
    ) {
        const model = this.moduleRef.get(getModelToken(CardBin.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<CardBin>(model);
        this.encryption = new RSAEncryption(`/etc/secrets/${this.request.tenantId}-public.pem`);
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

    async getBINServiceById(id: Types.ObjectId): Promise<PavilionService> {
        const cardBin = await this.repo.findOne({ _id: id });
        if (GetTenantDataSource(this.request) == TenantDataSource.Live) {
            const pavilionCredentials: RestUriCredentials = {
                baseUrl: this.config.PAVILION_BASE_URL_LIVE,
                secret: cardBin.config.partnerAccessKey,
                id: cardBin.config.partnerAccessId,
            };
            return PavilionService.new(this.request, this.config, this.http, pavilionCredentials);
        }
        return PavilionService.new(this.request, this.config, this.http);
    }

    async getCardStatus(binId: Types.ObjectId, id: string): Promise<Record<string, any>[]> {
        const pavilion = await this.getBINServiceById(binId);
        return pavilion.getCardStatus(id);
    }

    async unlinkCard(binId: Types.ObjectId, id: string, options?: ExecutionOptions): Promise<any> {
        const pavilion = await this.getBINServiceById(binId);
        return pavilion.unlinkCard(id, options);
    }

    async batchInstantCardRequest(program: HydratedDocument<CardProgram>, options?: ExecutionOptions): Promise<any> {
        console.log('===3 personalise');
        const pavilion = await this.getBINServiceById(program.bin);
        console.log('===4 personalise');
        return pavilion.batchInstantCardRequest(program, options);
    }

    async preparePavilionHeaders(binId: Types.ObjectId, key: Buffer, iv: Buffer): Promise<AxiosHeaders> {
        const pavilion = await this.getBINServiceById(binId);
        const res = await pavilion.prepareHeadersWithKeyAndIV(key, iv);

        const headers = new AxiosHeaders();
        headers.set('Content-Type', 'text/plain');
        headers.set('X-AccessKey', res.accessKey);
        headers.set('X-SessionKey', res.sessionKey);
        headers.set('X-SessionIV', res.encodedIV);

        return headers;
    }

    async create(dto: CreateCardBinDto): Promise<HydratedDocument<CardBin>> {
        const business = await this.businessModel.findById(dto.business);
        if (!business || business.status !== BusinessStatus.Approved) {
            throw BusinessException.BusinessNotApproved;
        }

        const range = dto.binRange as [string, string];
        const binLength = calculateBinLength(range);
        const bin = calculateBin(range);
        const binHash = await SCryptCryptoFactory.hashWithoutSalt(bin);

        const config: CardBinConfig = {
            partner: dto.config.partner,
            profile: dto.config.profile,
            partnerProfile: dto.config.partnerProfile,
            partnerAccessId: this.encryption.encryptOAEP(dto.config.partnerAccessId).toString('base64'),
            partnerAccessKey: this.encryption.encryptOAEP(dto.config.partnerAccessKey).toString('base64'),
        };

        const entity: Partial<CardBin> = {
            type: dto.type,
            name: dto.name,
            description: dto.description,
            network: dto.network,
            provider: dto.provider,
            business: dto.business,
            binRange: dto.binRange,
            binAccountNumber: dto.binAccountNumber,
            binLength,
            bin,
            binHash,
            config,
        };

        return this.repo.createAndSave(entity);
    }
}

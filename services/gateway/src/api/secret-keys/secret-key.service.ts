import { Inject, Injectable, Scope } from '@nestjs/common';
import { SecretKey } from './secret-key.schema';
import { ModuleRef, REQUEST } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { AccessKeyTag, TenantDataSource } from '@core/helpers/enums';
import { Repository, RepositoryFactory } from '@core/abstracts';
import { CreateSecretKeyDto, PatchSecretKeyDto, SecretKeyMetricsDto } from './secret-key.dto';
import { BusinessService } from '@api/business/business.service';
import { GetTenantDataSource, TenantRequestPayload, Utils } from '@core/helpers';
import { BusinessStatus } from '@api/business/business.enums';
import { AccessKeyUtils } from '@core/crypto';
import { Request } from 'express';
import { AuditService } from '@api/audit/audit.service';
import { AuditAction, AuditObjectModel } from '@api/audit/audit.schema';
import { Types } from 'mongoose';
import { JWTUser } from '@auth/jwt.strategy';
import { RedisKeys } from '@common/helpers/constants';
// redis removed
import { BusinessException } from '@api/business/business.exception';
import { SecretKeyStatus } from './secret-key.enums';
import { SecretKeyException } from './secret-key.exception';
import { ApiRequestsService } from '@api/api-requests/api-requests.service';
import {
    getSecretKeyDailyRequestsPipeline,
    getSecretKeyErrorsTodayPipeline,
    getSecretKeyRequestsTodayPipeline,
    getSecretKeyTotalRequestsPipeline,
} from './secret-key.utils';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class SecretKeyService {
    public repo: Repository<SecretKey>;

    constructor(
        @Inject(REQUEST) private request: TenantRequestPayload,
        private moduleRef: ModuleRef,
        private businessService: BusinessService,
        private auditService: AuditService,
        private apiRequestsService: ApiRequestsService,
    ) {
        const model = this.moduleRef.get(getModelToken(SecretKey.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<SecretKey>(model);
    }

    async create(user: JWTUser, data: CreateSecretKeyDto, req: Request): Promise<any> {
        const business = await this.businessService.findById(user.businessId);
        const dataSource = GetTenantDataSource(this.request);
        const accessKeyTag = dataSource === TenantDataSource.Live ? AccessKeyTag.LiveKey : AccessKeyTag.TestKey;

        if (dataSource === TenantDataSource.Live && business.status !== BusinessStatus.APPROVED) {
            throw BusinessException.BusinessNotApproved;
        }

        const [plainKey, hashedKey] = await AccessKeyUtils.generateAccessKey(accessKeyTag);

        const entity = Utils.removeNilValues({
            name: data.name,
            key: hashedKey,
            scopes: data.scopes,
            apiVersion: data.apiVersion,
            cidrWhitelist: data.cidrWhitelist,
            grpEnabled: data.grpEnabled,
            business,
        });

        const accessKey = await this.repo.createAndSave(entity);
        await this.auditService.create(
            {
                action: AuditAction.SecretKeyCreate,
                business: user.businessId,
                actor: user.userId,
                object: accessKey._id,
                objectModel: AuditObjectModel.AccessKey,
                data: entity,
            },
            req,
        );

        return { accessKey, plainKey };
    }

    async update(user: JWTUser, id: Types.ObjectId, data: PatchSecretKeyDto, req: Request): Promise<any> {
        const secretKey = await this.repo.findOne({ business: user.businessId, _id: id });
        if (secretKey.status === SecretKeyStatus.Terminated) {
            throw SecretKeyException.SecretKeyAlreadyTerminated;
        }

        const updatedSecretKey = await this.repo.findOneAndUpdate(
            { business: user.businessId, _id: secretKey.id },
            {
                name: data.name,
                scopes: data.scopes,
                apiVersion: data.apiVersion,
                cidrWhitelist: data.cidrWhitelist,
                grpEnabled: data.grpEnabled,
            },
        );

        await this.auditService.create(
            {
                action: AuditAction.SecretKeyUpdate,
                business: user.businessId,
                actor: user.userId,
                object: updatedSecretKey._id,
                objectModel: AuditObjectModel.AccessKey,
                data: updatedSecretKey,
            },
            req,
        );

        return updatedSecretKey;
    }

    /**
     * Delete a Access Key
     * @param publicId
     */
    async delete(publicId: Types.ObjectId, user: JWTUser, req: Request) {
        const secretKey = await this.repo.findOne({ business: user.businessId, _id: publicId });
        if (secretKey.status === SecretKeyStatus.Terminated) {
            throw SecretKeyException.SecretKeyAlreadyTerminated;
        }

        await this.repo.updateById(publicId, { status: SecretKeyStatus.Terminated, terminatedAt: new Date() });
        await this.auditService.create(
            {
                action: AuditAction.SecretKeyTerminate,
                business: user.businessId,
                actor: user.userId,
                object: new Types.ObjectId(publicId),
                objectModel: AuditObjectModel.AccessKey,
            },
            req,
        );
    }

    async getMetrics(user: JWTUser, id: Types.ObjectId, query: SecretKeyMetricsDto) {
        const secretKey = await this.repo.findOne({ _id: id, business: user.businessId });
        const days = parseInt(query.days || '7', 10);
        const keyId = secretKey._id as Types.ObjectId;

        const [requestsToday, errorsToday, totalRequests, dailyStats] = await Promise.all([
            this.apiRequestsService.repo.aggregate(getSecretKeyRequestsTodayPipeline(user.businessId, keyId)),
            this.apiRequestsService.repo.aggregate(getSecretKeyErrorsTodayPipeline(user.businessId, keyId)),
            this.apiRequestsService.repo.aggregate(getSecretKeyTotalRequestsPipeline(user.businessId, keyId)),
            this.apiRequestsService.repo.aggregate(getSecretKeyDailyRequestsPipeline(user.businessId, keyId, days)),
        ]);

        return {
            requestsToday: (requestsToday as any[])[0]?.count || 0,
            errorsToday: (errorsToday as any[])[0]?.count || 0,
            totalRequests: (totalRequests as any[])[0]?.count || 0,
            dailyStats: (dailyStats as any[]).map((d) => ({ date: d._id, count: d.count })),
        };
    }
}

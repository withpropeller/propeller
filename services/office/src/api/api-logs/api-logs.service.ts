import { Inject, Injectable, Scope } from '@nestjs/common';
import { ModuleRef, REQUEST } from '@nestjs/core';
import { GetTenantDataSource, ModelIdTag, TagMongoId, TenantDataSource, TenantRequestPayload } from '@core/helpers';
import { Repository, RepositoryFactory } from '@core/abstracts';
import { ApiRequest } from './api-log.schema';
import { getModelToken, InjectModel } from '@nestjs/mongoose';
import { User } from '@api/users';
import { Model, HydratedDocument, Types } from 'mongoose';
import { APIPagingDto } from '@common/api-paging';
import { Business } from '@api/business/business.schema';
import { APIRequestStatus } from './api-log.enums';
import { EnvoyEvent, EnvoyService } from '@common/envoy';
import { ApiRequestException } from './api-logs.exceptions';
import { RequestRetryDto } from './api-requests.dto';
import { MetricsQueryDto } from '@common/dtos';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class ApiLogsService {
    public repo: Repository<ApiRequest>;

    constructor(
        @Inject(REQUEST) private request: TenantRequestPayload,
        private moduleRef: ModuleRef,
        @InjectModel(User.name, TenantDataSource.Core)
        private userModel: Model<HydratedDocument<User>>,
        @InjectModel(Business.name, TenantDataSource.Core)
        private businessModel: Model<HydratedDocument<Business>>,
        private envoy: EnvoyService,
    ) {
        const model = this.moduleRef.get(getModelToken(ApiRequest.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<ApiRequest>(model);
    }

    getAll(query: APIPagingDto) {
        return this.repo.findByQuery(
            query,
            {},
            [],
            [
                { path: 'initiator', model: this.userModel },
                { path: 'business', model: this.businessModel },
            ],
        );
    }

    getOne(id: Types.ObjectId, query: APIPagingDto) {
        return this.repo.findOneWithOptions({
            conditions: { _id: id },
            select: query.select,
            expand: query.expand,
            populate: [
                { path: 'initiator', model: this.userModel },
                { path: 'business', model: this.businessModel },
            ],
        });
    }

    async retry(id: Types.ObjectId, body: RequestRetryDto) {
        const apiRequest = await this.repo.findOneWithOptions({ conditions: { _id: id }, select: 'id status' });
        if (apiRequest.status == APIRequestStatus.Pending) {
            return this.sendRequestProcessEvents(apiRequest, !!body.forceHardStop);
        }

        throw ApiRequestException.CannotRetryRequest;
    }

    async sendRequestProcessEvents(apiLog: HydratedDocument<ApiRequest>, forceHardStop: boolean) {
        const eventData = {
            request: TagMongoId(ModelIdTag.Request, apiLog.id),
            forceRetry: true,
            forceHardStop,
        };

        this.envoy.dispatch(EnvoyEvent.newRequest(GetTenantDataSource(this.request), eventData));
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
                    byMethod: [
                        { $group: { _id: '$method', count: { $sum: 1 } } },
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
                    byMethod: {
                        $arrayToObject: {
                            $map: { input: '$byMethod', as: 'v', in: { k: '$$v._id', v: '$$v.count' } },
                        },
                    },
                    total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
                },
            },
        ]);

        return result ?? { byStatus: {}, byMethod: {}, total: 0 };
    }
}

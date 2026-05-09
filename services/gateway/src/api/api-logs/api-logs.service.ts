import { Inject, Injectable, Scope } from '@nestjs/common';
import { ModuleRef, REQUEST } from '@nestjs/core';
import { GetTenantDataSource, TenantDataSource, TenantRequestPayload } from '@core/helpers';
import { Repository, RepositoryFactory } from '@core/abstracts';
import { ApiRequest } from './api-log.schema';
import { getModelToken, InjectModel } from '@nestjs/mongoose';
import { User } from '@api/users';
import { Model, HydratedDocument } from 'mongoose';
import { JWTUser } from '@auth/jwt.strategy';
import { APIPagingDto } from '@common/api-paging';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class ApiLogsService {
    public repo: Repository<ApiRequest>;

    constructor(
        @Inject(REQUEST) private request: TenantRequestPayload,
        private moduleRef: ModuleRef,
        @InjectModel(User.name, TenantDataSource.Core)
        private userModel: Model<HydratedDocument<User>>,
    ) {
        const model = this.moduleRef.get(getModelToken(ApiRequest.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<ApiRequest>(model);
    }

    getAll(user: JWTUser, query: APIPagingDto) {
        return this.repo.findByQuery(
            query,
            { business: user.businessId },
            ['business'],
            [{ path: 'initiator', model: this.userModel }],
        );
    }

    getOne(id: string, businessId: string, query: APIPagingDto) {
        return this.repo.findOneWithOptions({
            conditions: { _id: id, business: businessId },
            select: query.select,
            expand: query.expand,
            populate: [{ path: 'initiator', model: this.userModel }],
        });
    }
}

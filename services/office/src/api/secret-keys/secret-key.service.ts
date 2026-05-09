import { Inject, Injectable, Scope } from '@nestjs/common';
import { SecretKey } from './secret-key.schema';
import { ModuleRef, REQUEST } from '@nestjs/core';
import { InjectModel, getModelToken } from '@nestjs/mongoose';
import { Repository, RepositoryFactory } from '@core/abstracts';
import { GetTenantDataSource, TenantDataSource, TenantRequestPayload } from '@core/helpers';
import { Business } from '@api/business/business.schema';
import { APIPagingDto } from '@common/api-paging';
import { Model, HydratedDocument, Types } from 'mongoose';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class SecretKeyService {
    public repo: Repository<SecretKey>;

    constructor(
        @Inject(REQUEST) private request: TenantRequestPayload,
        private moduleRef: ModuleRef,
        @InjectModel(Business.name, TenantDataSource.Core)
        private businessModel: Model<HydratedDocument<Business>>,
    ) {
        const model = this.moduleRef.get(getModelToken(SecretKey.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<SecretKey>(model);
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
}

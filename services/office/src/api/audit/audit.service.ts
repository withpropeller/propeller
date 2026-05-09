import { Inject, Injectable, Scope } from '@nestjs/common';
import { InjectModel, getModelToken } from '@nestjs/mongoose';
import { Repository, RepositoryFactory } from '@core/abstracts/repository';
import { Audit } from './audit.schema';
import { GetTenantDataSource, TenantDataSource, TenantRequestPayload } from '@core/helpers';
import { REQUEST, ModuleRef } from '@nestjs/core';
import { Request } from 'express';
import * as DeviceDetector from 'device-detector-js';
import { getClientIp } from 'request-ip';
import { Business } from '@api/business/business.schema';
import { APIPagingDto } from '@common/api-paging';
import { Model, HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class AuditService {
    public repo: Repository<Audit>;
    private deviceDetector: DeviceDetector;

    constructor(
        @Inject(REQUEST) private request: TenantRequestPayload,
        private moduleRef: ModuleRef,
        @InjectModel(Business.name, TenantDataSource.Core)
        private businessModel: Model<HydratedDocument<Business>>,
    ) {
        const model = this.moduleRef.get(getModelToken(Audit.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<Audit>(model);
        this.deviceDetector = new DeviceDetector();
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

    create(data: Partial<Audit>, req: Request) {
        const ipAddress = getClientIp(req);
        const deviceData = this.deviceDetector.parse(req.headers['user-agent']);

        data.source = { ipAddress, ...deviceData };
        this.repo.createAndSave(data);
    }
}

import { Inject, Injectable, Scope } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Repository, RepositoryFactory } from '@core/abstracts/repository';
import { Audit } from './audit.schema';
import { GetTenantDataSource, TenantRequestPayload } from '@core/helpers';
import { REQUEST, ModuleRef } from '@nestjs/core';
import { Request } from 'express';
import * as DeviceDetector from 'device-detector-js';
import { getClientIp } from 'request-ip';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class AuditService {
    public repo: Repository<Audit>;
    private deviceDetector: DeviceDetector;

    constructor(@Inject(REQUEST) private request: TenantRequestPayload, private moduleRef: ModuleRef) {
        const model = this.moduleRef.get(getModelToken(Audit.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<Audit>(model);
        this.deviceDetector = new DeviceDetector();
    }

    create(data: Partial<Audit>, req: Request): Promise<Audit> {
        const ipAddress = getClientIp(req);
        const deviceData = this.deviceDetector.parse(req.headers['user-agent']);

        data.source = { ipAddress, ...deviceData };
        return this.repo.createAndSave(data);
    }
}

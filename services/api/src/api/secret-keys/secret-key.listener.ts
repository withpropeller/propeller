import { EventTask, EventTasks } from '@core/events';
import { TenantDataSource } from '@core/helpers';
import { TenantRequestPayload } from '@core/helpers/tenant-context-id.strategy';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument } from 'mongoose';
import { SecretKey } from './secret-key.schema';
import { SecretKeyService } from './secret-key.service';

@Injectable()
export class SecretKeyListener implements OnModuleInit {
    private serviceTenants = new Map<string, SecretKeyService>();

    constructor(private moduleRef: ModuleRef, private eventEmitter: EventEmitter2) {}

    onModuleInit() {
        this.setServiceTenants({ tenantId: TenantDataSource.Live });
        this.setServiceTenants({ tenantId: TenantDataSource.Sandbox });
    }

    setServiceTenants(payload: TenantRequestPayload) {
        const service = new SecretKeyService(payload, this.moduleRef, this.eventEmitter);
        this.serviceTenants.set(payload.tenantId, service);
    }

    @OnEvent(EventTasks.SecretKeyUse)
    private handleAccessKeyUseEvent(event: EventTask<HydratedDocument<SecretKey>>) {
        const service = this.serviceTenants.get(event.tenantId);
        return service.repo.updateById(event.data.id, {
            $set: { lastUsed: new Date() },
        });
    }
}

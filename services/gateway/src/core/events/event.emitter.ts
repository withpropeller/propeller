import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventTask, EventTasks } from './event-task';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { ExecutionOptions } from '@core/interfaces';
import { GetTenantDataSource, TenantRequestPayload } from '@core/helpers/tenant-context-id.strategy';
import { REQUEST } from '@nestjs/core';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class EventEmitter {
    constructor(@Inject(REQUEST) private request: TenantRequestPayload, private eventEmitter2: EventEmitter2) {}

    emit(task: EventTasks, data: any, options?: ExecutionOptions) {
        const event = new EventTask(task, GetTenantDataSource(this.request), data, options);
        this.eventEmitter2.emit(event.name, event);
    }
}

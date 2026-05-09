import { ExecutionOptions } from '@common/interfaces';
import { IEvent } from './event.interface';

export class EventTask<T = any> implements IEvent<T> {
    readonly tenantId: string;
    readonly consumer?: string;
    readonly name: string;
    readonly data: T;
    readonly options?: ExecutionOptions;

    constructor(name: string, tenantId: string, data: T, options?: ExecutionOptions) {
        this.tenantId = tenantId;
        this.name = name;
        this.data = data;
        this.options = options;
    }
}

export enum EventTasks {
    ApiLogsCreate = 'api-logs.create',
    SecretKeyUse = 'secret-key.use',
    CardCreated = 'card.created',
    CardLinked = 'card.linked',
    CardActivated = 'card.activated',
}

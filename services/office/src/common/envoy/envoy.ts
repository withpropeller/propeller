import { TenantDataSource } from '@core/helpers';

export enum EnvoyEventStream {
    WebhookActive = 'webhook:active',
    PaymentActive = 'payment:active',
    PaymentBacklog = 'payment:backlog',
    NotificationActive = 'notification:active',
    RequestActive = 'request:active',
    ISVActive = 'isv:active',
}

export enum EnvoyEventType {
    Consumer = 'consumer',
    System = 'system',
}

export enum EnvoyDeliveryStrategy {
    Async,
    AsyncOnce,
    Sync,
}

export class EnvoyEvent<T = any> {
    public type: EnvoyEventType = EnvoyEventType.Consumer;
    public streamName: EnvoyEventStream;
    public strategy: EnvoyDeliveryStrategy = EnvoyDeliveryStrategy.Async;
    public tenant: TenantDataSource;
    public payload: T;

    static new(
        tenant: TenantDataSource,
        streamName: EnvoyEventStream,
        data: any,
        strategy = EnvoyDeliveryStrategy.Async,
    ) {
        const obj = new this();
        obj.tenant = tenant;
        obj.streamName = streamName;
        obj.payload = data;
        obj.strategy = strategy;
        return obj;
    }

    static newWebhook(tenant: TenantDataSource, data: any) {
        return this.new(tenant, EnvoyEventStream.WebhookActive, data);
    }

    static newPayment(tenant: TenantDataSource, data: any) {
        return this.new(tenant, EnvoyEventStream.PaymentActive, data);
    }

    static newPaymentBacklog(tenant: TenantDataSource, data: any) {
        return this.new(tenant, EnvoyEventStream.PaymentBacklog, data);
    }

    static newNotification(data: any) {
        return this.new(TenantDataSource.Core, EnvoyEventStream.NotificationActive, data);
    }

    static newRequest(tenant: TenantDataSource, data: any) {
        return this.new(tenant, EnvoyEventStream.RequestActive, data);
    }

    static newISV(tenant: TenantDataSource, data: any) {
        return this.new(tenant, EnvoyEventStream.ISVActive, data);
    }

    toObject() {
        return {
            type: this.type,
            payload: JSON.stringify(this.payload),
            tenant: this.tenant,
            strategy: this.strategy,
        };
    }

    static fromObject(res: any): EnvoyEvent {
        const obj = new this();
        obj.tenant = res.tenant;
        obj.type = res.type;
        obj.payload = JSON.parse(res.payload);
        obj.strategy = parseInt(res.strategy, 10);
        return obj;
    }
}

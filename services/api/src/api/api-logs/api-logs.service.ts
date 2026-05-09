import { Inject } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { ApiRequest } from './api-logs.schema';
import { Repository, RepositoryFactory } from '@core/abstracts';
import { TenantRequestPayload, GetTenantDataSource } from '@core/helpers/tenant-context-id.strategy';
import { REQUEST, ModuleRef } from '@nestjs/core';
import { Webhook } from '@api/webhooks/webhooks.schema';
import { Event } from '@api/events/event.schema';
import { WebhookEventTypes } from '@api/webhooks/webhook.enums';
import { HydratedDocument, Types } from 'mongoose';
import { ModelRef } from '@core/helpers';
import { ModelIdTag, TagMongoId } from '@core/mongo';
import { EnvoyEvent, EnvoyService } from '@common/envoy';
import { APIRequestStatus } from './api-logs.enums';
import { ApiRequestException } from './api-logs.exceptions';
import { ExecutionOptions } from '@common/interfaces';

export class ApiLogsService {
    public repo: Repository<ApiRequest>;
    public webhookRepo: Repository<Webhook>;
    public eventRepo: Repository<Event>;
    public envoy: EnvoyService;

    constructor(@Inject(REQUEST) private request: TenantRequestPayload, private moduleRef: ModuleRef) {
        const model = this.moduleRef.get(getModelToken(ApiRequest.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        const webhookModel = this.moduleRef.get(getModelToken(Webhook.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        const eventModel = this.moduleRef.get(getModelToken(Event.name, GetTenantDataSource(this.request)), {
            strict: false,
        });

        this.repo = RepositoryFactory<ApiRequest>(model);
        this.webhookRepo = RepositoryFactory<Webhook>(webhookModel);
        this.eventRepo = RepositoryFactory<Event>(eventModel);
        this.envoy = this.moduleRef.get(EnvoyService, { strict: false });
    }

    async cancel(businessId: Types.ObjectId, accountId: Types.ObjectId, options?: ExecutionOptions) {
        const apiLog = await this.repo.findOneWithOptions({
            conditions: { _id: accountId, business: businessId },
        });

        if (apiLog.status !== APIRequestStatus.Pending) {
            throw ApiRequestException.CannotCancelRequest;
        }

        const updatedAPIRequest = await this.repo.findOneAndUpdateById(apiLog.id, {
            status: APIRequestStatus.Cancelled,
        });

        if (!options?.dryRun) {
            await this.createAndSendWebhookEvent(updatedAPIRequest, WebhookEventTypes.RequestCancelled);
        }
    }

    // TODO: Migrate old api logs to add events
    async createAndSendWebhookEvent(apiLog: HydratedDocument<ApiRequest>, eventType: WebhookEventTypes) {
        const webhooks = await this.webhookRepo.find({
            business: apiLog.business,
            disabled: { $ne: true },
            events: { $in: [eventType] },
        });

        const event = await this.eventRepo.createAndSave({
            type: eventType,
            body: apiLog.toJSON(),
            source: apiLog.id,
            sourceRef: ModelRef.Request,
            business: apiLog.business,
        });

        // update the api log with the event id
        await this.repo.updateById(apiLog.id, { $addToSet: { events: event.id } });

        for (const webhook of webhooks) {
            await this.sendWebhookEvent(webhook, event);
        }
    }

    async sendWebhookEvent(webhook: HydratedDocument<Webhook>, event: HydratedDocument<Event>) {
        const payload = {
            webhook: TagMongoId(ModelIdTag.Webhook, webhook.id),
            event: TagMongoId(ModelIdTag.Event, event.id),
        };

        return this.envoy.dispatch(EnvoyEvent.newWebhook(GetTenantDataSource(this.request), payload));
    }

    async sendRequestProcessEvents(apiLog: HydratedDocument<ApiRequest>) {
        const eventData = {
            request: TagMongoId(ModelIdTag.Request, apiLog.id),
        };

        this.envoy.dispatch(EnvoyEvent.newRequest(GetTenantDataSource(this.request), eventData));
    }
}

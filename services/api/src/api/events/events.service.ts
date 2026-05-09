import { Inject, Injectable, Scope } from '@nestjs/common';
import { ModuleRef, REQUEST } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Repository, RepositoryFactory } from '@core/abstracts';
import { TenantRequestPayload, GetTenantDataSource } from '@core/helpers/tenant-context-id.strategy';
import { Event, EventAttempt } from './event.schema';
import { AccessKey } from '@core/interfaces';
import { EventException } from './events.exception';
import { HydratedDocument, Types } from 'mongoose';
import { EnvoyEvent, EnvoyService } from '@common/envoy';
import { ModelIdTag, TagMongoId } from '@core/mongo';
import { Webhook } from '@api/webhooks/webhooks.schema';
import { WebhookService } from '@api/webhooks/webhooks.service';
import { WebhookEventTypes } from '@api/webhooks/webhook.enums';
import { ExecutionOptions } from '@common/interfaces';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class EventService {
    public repo: Repository<Event>;
    public attemptRepo: Repository<EventAttempt>;

    constructor(
        @Inject(REQUEST) private request: TenantRequestPayload,
        private moduleRef: ModuleRef,
        private webhookService: WebhookService,
        private envoy: EnvoyService,
    ) {
        const model = this.moduleRef.get(getModelToken(Event.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        const eventAttemptModel = this.moduleRef.get(
            getModelToken(EventAttempt.name, GetTenantDataSource(this.request)),
            { strict: false },
        );
        this.repo = RepositoryFactory<Event>(model);
        this.attemptRepo = RepositoryFactory<EventAttempt>(eventAttemptModel);
    }

    public async retryEvent(key: AccessKey, eventId: Types.ObjectId, options?: ExecutionOptions) {
        const event = await this.repo.findOne({
            _id: eventId,
            business: key.businessId,
        });
        if (event.sync) {
            throw EventException.CannotResendSyncEvents;
        }

        const webhooks = await this.webhookService.repo.find({
            business: key.businessId,
            disabled: { $ne: true },
            events: { $in: [event.type] },
        });

        for (const webhook of webhooks) {
            await this.sendWebhookEvent(webhook, event, options);
        }
    }

    public async retryEventBySourceAndType(
        business: Types.ObjectId,
        source: Types.ObjectId,
        eventType: WebhookEventTypes,
        options?: ExecutionOptions,
    ) {
        const event = await this.repo.findOne({
            type: eventType,
            source: source,
            business: business,
        });

        if (event.sync) {
            throw EventException.CannotResendSyncEvents;
        }

        const webhooks = await this.webhookService.repo.find({
            business: business,
            disabled: { $ne: true },
            events: { $in: [event.type] },
        });

        for (const webhook of webhooks) {
            await this.sendWebhookEvent(webhook, event, options);
        }
    }

    async sendWebhookEvent(
        webhook: HydratedDocument<Webhook>,
        event: HydratedDocument<Event>,
        options?: ExecutionOptions,
    ) {
        const payload = {
            webhook: TagMongoId(ModelIdTag.Webhook, webhook.id),
            event: TagMongoId(ModelIdTag.Event, event.id),
        };

        if (!options?.dryRun) {
            await this.envoy.dispatchAsyncOnce(EnvoyEvent.newWebhook(GetTenantDataSource(this.request), payload));
        }
    }

    async dispatchEventsToWebhooks(event: HydratedDocument<Event>, options?: ExecutionOptions) {
        const webhooks = await this.webhookService.repo.find({
            business: event.business,
            disabled: { $ne: true },
            events: { $in: [event.type] },
        });

        for (const webhook of webhooks) {
            await this.sendWebhookEvent(webhook, event, options);
        }
    }
}

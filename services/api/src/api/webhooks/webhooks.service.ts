import { Types } from 'mongoose';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { ModuleRef, REQUEST } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Repository, RepositoryFactory } from '@core/abstracts';
import { RollSecretWebhookDto, SendEventPayloadDto, WebhookDto } from './webhook.dto';
import { Webhook } from './webhooks.schema';
import { ConfigService } from '@config/config.service';
import { TenantRequestPayload, GetTenantDataSource } from '@core/helpers/tenant-context-id.strategy';
import { AESEncryption } from '@core/crypto/aes-gcm-encryption';
import { AccessKeyUtils } from '@core/crypto/generate-access-key';
import { ModelIdTag, TagMongoId } from '@core/mongo';
import { EnvoyEvent, EnvoyService } from '@common/envoy';
import { AccessKeyTag } from '@core/interfaces';
import { WebhookException } from './webhook.exception';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class WebhookService {
    public repo: Repository<Webhook>;

    constructor(
        @Inject(REQUEST) private request: TenantRequestPayload,
        private moduleRef: ModuleRef,
        private config: ConfigService,
        private envoy: EnvoyService,
    ) {
        const model = this.moduleRef.get(getModelToken(Webhook.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<Webhook>(model);
    }

    async create(data: WebhookDto, businessId: Types.ObjectId) {
        let signingKey: string, secureSigningKey: Buffer;

        const existingWebhook = await this.repo.findOne({ url: data.url, business: businessId }, true);
        if (existingWebhook) {
            throw WebhookException.WebhookUrlAlreadyExists;
        }

        if (data.signingKey) {
            signingKey = data.signingKey;
            secureSigningKey = AESEncryption.encryptPassphrase(data.signingKey, this.config.ENCRYPTION_PASSPHRASE);
        } else {
            [signingKey, secureSigningKey] = AccessKeyUtils.generateSigningKey(
                AccessKeyTag.WebhookSigningKey,
                this.config.ENCRYPTION_PASSPHRASE,
            );
        }

        const entity = await this.repo.createAndSave({
            ...data,
            business: businessId,
            secureSigningKey,
        });

        const json = entity.toJSON();
        json.signingKey = signingKey;

        return json;
    }

    //TODO: Ensure edit doesn't remove events needed by other services
    async update(id: Types.ObjectId, data: WebhookDto, businessId: Types.ObjectId) {
        const webhook = await this.repo.findOne({
            _id: id,
            business: businessId,
        });

        if (data.url) {
            const existingWebhook = await this.repo.findOne(
                {
                    url: data.url,
                    business: businessId,
                    _id: { $ne: webhook.id },
                },
                true,
            );
            if (existingWebhook) {
                throw WebhookException.WebhookUrlAlreadyExists;
            }
        }

        return this.repo.findOneAndUpdate({ _id: id }, data);
    }

    async updateDisabled(id: Types.ObjectId, businessId: Types.ObjectId, disabled: boolean) {
        const webhook = await this.repo.findOne({ _id: id, business: businessId });

        return this.repo.findOneAndUpdate({ _id: webhook._id }, { disabled });
    }

    async delete(id: Types.ObjectId, businessId: Types.ObjectId) {
        return this.repo.deleteById(id);
    }

    async revealSecret(businessId: Types.ObjectId, id: Types.ObjectId) {
        const entity = await this.repo.findOne({
            _id: id,
            business: businessId,
        });

        const signingKey = AESEncryption.decryptPassphrase(entity.secureSigningKey, this.config.ENCRYPTION_PASSPHRASE);

        const json = entity.toJSON();
        json.signingKey = signingKey;

        return json;
    }

    async rollSecret(businessId: Types.ObjectId, id: Types.ObjectId, data: RollSecretWebhookDto) {
        let signingKey: string, secureSigningKey: Buffer;

        const entity = await this.repo.findOne({
            _id: id,
            business: businessId,
        });

        if (data.signingKey) {
            signingKey = data.signingKey;
            secureSigningKey = AESEncryption.encryptPassphrase(data.signingKey, this.config.ENCRYPTION_PASSPHRASE);
        } else {
            [signingKey, secureSigningKey] = AccessKeyUtils.generateSigningKey(
                AccessKeyTag.WebhookSigningKey,
                this.config.ENCRYPTION_PASSPHRASE,
            );
        }

        const webhook = await this.repo.findOneAndUpdate({ _id: entity.id }, { secureSigningKey });

        const json = webhook.toJSON();
        json.signingKey = signingKey;

        return json;
    }

    async sendEvents(businessId: Types.ObjectId, id: Types.ObjectId, payload: SendEventPayloadDto) {
        const entity = await this.repo.findOne({
            _id: id,
            business: businessId,
        });
        const eventData = {
            webhook: TagMongoId(ModelIdTag.Webhook, entity.id),
            event: payload.event,
            body: {
                event: payload.event,
                data: payload.data,
            },
        };

        this.envoy.dispatch(EnvoyEvent.newWebhook(GetTenantDataSource(this.request), eventData));
    }
}

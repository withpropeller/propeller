import { Inject } from '@nestjs/common';
import { AccessKeyException } from './secret-key.exception';
import { HmacHash } from '@core/crypto/hmac-hash';
import { getModelToken } from '@nestjs/mongoose';
import { SecretKey } from './secret-key.schema';
import { Repository, RepositoryFactory } from '@core/abstracts';
import { TenantRequestPayload, GetTenantDataSource } from '@core/helpers/tenant-context-id.strategy';
import { REQUEST, ModuleRef } from '@nestjs/core';
import { RedisKeys } from '@core/helpers/enums';
import { FloService, floEncode, floDecodeJson } from '@core/services/flo.service';
import { EventTask, EventTasks } from '@core/events';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SecretKeyStatus } from './secret-key.enums';

export class SecretKeyService {
    public repo: Repository<SecretKey>;
    private flo: FloService;

    constructor(
        @Inject(REQUEST) private request: TenantRequestPayload,
        private moduleRef: ModuleRef,
        private eventEmitter: EventEmitter2,
    ) {
        const model = this.moduleRef.get(getModelToken(SecretKey.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<SecretKey>(model);
        this.flo = this.moduleRef.get(FloService, { strict: false });
    }

    async getKey(plainKey: string, failSilently = false): Promise<SecretKey> {
        const plainKeySplit = plainKey.split('.');

        const secret = plainKeySplit.splice(-1);
        const key = plainKeySplit.join('.');
        const hash = await HmacHash.hash(key, secret[0]);
        const hashedKey = key + '.' + hash;

        const accessKey = await this.fetchAccessKey(hashedKey);

        if (!accessKey && !failSilently) {
            throw new AccessKeyException(`Access Key Invalid`);
        }

        return accessKey;
    }

    async fetchAccessKey(hashedKey: string): Promise<SecretKey> {
        const key = `${RedisKeys.Views}:${hashedKey}`;

        let accessKeyObject = floDecodeJson<SecretKey>(
            (await this.flo.client.kv.jsonGet(key, '$'))?.value ?? null,
        );
        if (!accessKeyObject) {
            const accessKey = await this.repo.findOne({ key: hashedKey, status: SecretKeyStatus.Active }, true);
            if (!accessKey) {
                return null;
            }

            accessKeyObject = accessKey.toJSON();
            await this.flo.client.kv.jsonSet(key, '$', floEncode(accessKeyObject));
            await this.flo.client.kv.touch(key, BigInt(60 * 60 * 24 * 30)); // 30 days
        }

        const event = new EventTask(EventTasks.SecretKeyUse, this.request.tenantId, accessKeyObject);
        this.eventEmitter.emit(event.name, event);

        return accessKeyObject;
    }
}

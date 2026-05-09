import { RedisKeys } from '@core/helpers';
import { RedisService } from '@core/services/redis.service';
import { Injectable } from '@nestjs/common';

import { EnvoyDeliveryStrategy, EnvoyEvent, EnvoyEventStream } from '../envoy/envoy';

@Injectable()
export class EnvoyService {
    constructor(private redis: RedisService) {}

    async dispatch(event: EnvoyEvent): Promise<string> {
        const streamKey = this.buildStreamKey(event);
        return this.redis.addToStream(streamKey, event.toObject());
    }

    async dispatchSync<T = any>(event: EnvoyEvent): Promise<EnvoyEvent<T>> {
        event.strategy = EnvoyDeliveryStrategy.Sync;
        const eventId = await this.dispatch(event);
        return this.listen<T>(event.streamName, eventId);
    }

    async dispatchAsyncOnce<T = any>(event: EnvoyEvent): Promise<string> {
        event.strategy = EnvoyDeliveryStrategy.AsyncOnce;
        return this.dispatch(event);
    }

    async listen<T = any>(stream: EnvoyEventStream, id?: string, timeout = 4000): Promise<EnvoyEvent<T>> {
        const tempStream = `${RedisKeys.EnvoyStream}:${stream}:temp:${id}`;
        const res = await this.redis.readOneFromStream(tempStream, timeout);
        await this.redis.delete(tempStream);
        if (!res) return null;

        return EnvoyEvent.fromObject(res);
    }

    private buildStreamKey(event: EnvoyEvent): string {
        return `${RedisKeys.EnvoyStream}:${event.streamName}`;
    }
}

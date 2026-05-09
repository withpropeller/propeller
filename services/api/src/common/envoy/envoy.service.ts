import { Injectable } from '@nestjs/common';
import { FloService, floEncode, floDecodeJson } from '@core/services/flo.service';

import { EnvoyDeliveryStrategy, EnvoyEvent, EnvoyEventStream } from './envoy';

/**
 * EnvoyService — event dispatcher backed by Flo streams.
 *
 * Publishes directly to the same named streams that the Go event system
 * already reads (payment-events, raw-webhooks, etc.).
 *
 *   dispatch()          → stream.append  (fire-and-forget)
 *   dispatchAsyncOnce() → stream.append  (consumer group ack on reader side)
 *   dispatchSync()      → stream.append + read reply from temp stream
 */
@Injectable()
export class EnvoyService {
    constructor(private readonly flo: FloService) {}

    /** Map the old Envoy stream enum to the canonical Flo stream names */
    private streamName(s: EnvoyEventStream): string {
        switch (s) {
            case EnvoyEventStream.PaymentActive:
            case EnvoyEventStream.PaymentBacklog:
                return 'payment-events';
            case EnvoyEventStream.WebhookActive:
                return 'raw-webhooks';
            case EnvoyEventStream.NotificationActive:
                return 'notification-events';
            case EnvoyEventStream.RequestActive:
                return 'request-events';
            case EnvoyEventStream.StaticActive:
                return 'static-events';
            default:
                return s as string;
        }
    }

    /**
     * Fire-and-forget dispatch.
     *
     * Builds the same event envelope as the Go services:
     *   { type, timestamp, tenant, strategy, payload }
     */
    async dispatch(event: EnvoyEvent): Promise<string> {
        const envelope = {
            type: event.streamName,
            timestamp: new Date().toISOString(),
            tenant: event.tenant,
            strategy: event.strategy,
            payload: event.payload,
        };
        const result = await this.flo.client.stream.append(
            this.streamName(event.streamName),
            floEncode(envelope),
        );
        return `${result.id.timestampMs}-${result.id.sequence}`;
    }

    /**
     * Synchronous request/reply pattern.
     *
     * Appends the event, then blocks on a reply stream keyed by the
     * event's unique id until the handler sends a response (or timeout).
     */
    async dispatchSync<T = any>(
        event: EnvoyEvent,
        timeout = 4000,
    ): Promise<EnvoyEvent<T> | null> {
        event.strategy = EnvoyDeliveryStrategy.Sync;
        const eventId = await this.dispatch(event);

        const replyStream = `reply:${eventId}`;
        const group = `sync:${replyStream}`;
        const consumer = `consumer`;

        try {
            await this.flo.client.stream.groupJoin(replyStream, group, consumer);
        } catch {
            // group already exists — ok
        }

        const result = await this.flo.client.stream.groupRead(replyStream, {
            group,
            consumer,
            limit: 1,
            blockMs: timeout,
        } as any);

        if (!result.records?.length) return null;

        const rec = result.records[0];
        await this.flo.client.stream.groupAck(replyStream, [rec.id], { group } as any);

        // Clean up the response stream key
        try { await this.flo.client.kv.delete(replyStream); } catch { /* ok */ }

        const reply = floDecodeJson(rec.payload);
        return EnvoyEvent.fromObject(reply);
    }

    /**
     * Deliver at most once. The reader side uses consumer groups + ack
     * to guarantee at-most-once delivery.
     */
    async dispatchAsyncOnce<T = any>(event: EnvoyEvent): Promise<string> {
        event.strategy = EnvoyDeliveryStrategy.AsyncOnce;
        return this.dispatch(event);
    }

    /**
     * Listen for a reply on a temporary reply stream.
     * Kept for backwards compat with callers that use
     * `envoy.listen(stream, id, timeout)`.
     */
    async listen<T = any>(
        stream: EnvoyEventStream,
        id: string,
        timeout = 4000,
    ): Promise<EnvoyEvent<T> | null> {
        const replyStream = `reply:${stream}:${id}`;
        const group = `listen:${replyStream}`;
        const consumer = `worker`;

        try {
            await this.flo.client.stream.groupJoin(replyStream, group, consumer);
        } catch { /* ok */ }

        const result = await this.flo.client.stream.groupRead(replyStream, {
            group,
            consumer,
            limit: 1,
            blockMs: timeout,
        } as any);

        if (!result.records?.length) return null;

        const rec = result.records[0];
        await this.flo.client.stream.groupAck(replyStream, [rec.id], { group } as any);

        try { await this.flo.client.kv.delete(replyStream); } catch { /* ok */ }

        const reply = floDecodeJson(rec.payload);
        return EnvoyEvent.fromObject(reply);
    }
}


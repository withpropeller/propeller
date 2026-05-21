import { Injectable, Logger } from '@nestjs/common';
import { FloService } from '@core/services/flo.service';
import { EnvoyDeliveryStrategy, EnvoyEvent, EnvoyEventStream } from './envoy';

// Streams that should be dispatched via Flo
const FLO_STREAMS: Set<EnvoyEventStream> = new Set([
    EnvoyEventStream.KybStream,
    EnvoyEventStream.BusinessStream,
    EnvoyEventStream.PaymentActive,
    EnvoyEventStream.PaymentBacklog,
    EnvoyEventStream.NotificationActive,
]);

/** Map EnvoyEventStream enum values to canonical Flo stream names */
function floStreamName(s: EnvoyEventStream): string {
    switch (s) {
        case EnvoyEventStream.KybStream:
            return 'kyb-events';
        case EnvoyEventStream.BusinessStream:
            return 'business-events';
        case EnvoyEventStream.PaymentActive:
        case EnvoyEventStream.PaymentBacklog:
            return 'payment-events';
        case EnvoyEventStream.NotificationActive:
            return 'notification-events';
        default:
            return s as string;
    }
}

/**
 * EnvoyService — event dispatcher backed by Flo streams.
 *
 * KYB/business/payment events are dispatched to real Flo streams.
 * Any stream not in the FLO_STREAMS set falls back to a no-op stub
 * until the full Flo migration is complete.
 */
@Injectable()
export class EnvoyService {
    private readonly logger = new Logger(EnvoyService.name);

    constructor(private readonly flo: FloService) {}

    async dispatch(event: EnvoyEvent): Promise<string> {
        if (!FLO_STREAMS.has(event.streamName)) {
            this.logger.warn(`EnvoyService.dispatch: no-op for stream ${event.streamName}`);
            return 'stub-id';
        }

        const envelope = {
            type: event.payload?.event ?? event.streamName,
            timestamp: new Date().toISOString(),
            tenant: event.tenant,
            strategy: event.strategy,
            payload: event.payload,
        };

        const result = await this.flo.append(floStreamName(event.streamName), envelope);
        return `${result.id.timestampMs}-${result.id.sequence}`;
    }

    async dispatchSync<T = any>(event: EnvoyEvent): Promise<EnvoyEvent<T> | null> {
        // Full sync request/reply pattern not needed for KYB flows — use dispatch()
        return null;
    }

    async dispatchAsyncOnce<T = any>(event: EnvoyEvent): Promise<string> {
        return this.dispatch(event);
    }

    async listen<T = any>(stream: EnvoyEventStream, id?: string, timeout = 4000): Promise<EnvoyEvent<T> | null> {
        return null;
    }
}

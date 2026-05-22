import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { FloClient } from '@floruntime/node';
import { ConfigService } from '@config/config.service';

const enc = new TextEncoder();
const dec = new TextDecoder();

/** Encode a string or JSON-serialisable value to Uint8Array for Flo KV/streams. */
export const floEncode = (v: unknown): Uint8Array =>
    typeof v === 'string' ? enc.encode(v) : enc.encode(JSON.stringify(v));

/** Decode a Flo KV payload to a UTF-8 string (null if missing). */
export const floDecodeStr = (v: Uint8Array | null): string | null =>
    v ? dec.decode(v) : null;

/** Decode + JSON.parse in one shot. */
export const floDecodeJson = <T = unknown>(v: Uint8Array | null): T | null => {
    if (!v) return null;
    return JSON.parse(dec.decode(v));
};

/**
 * Shared Flo client service.
 *
 * Every module injects this and works with Flo's native API:
 *
 *   this.flo.client.kv.get(key)          // → GetResult | null
 *   this.flo.client.kv.put(key, bytes)   // → PutResult
 *   this.flo.client.kv.scan(prefix)      // → ScanResult
 *   this.flo.client.stream.append(...)   // → StreamAppendResult
 *
 * There is no Redis-compatibility layer — code works directly with
 * `GetResult { value, version }`, `PutResult { version }`, etc.
 */
@Injectable()
export class FloService implements OnModuleInit, OnModuleDestroy {
    readonly client: FloClient;

    constructor(private config: ConfigService) {
        this.client = new FloClient(this.config.FLO_ADDR, { namespace: this.config.FLO_NAMESPACE });
    }

    async onModuleInit() {
        await this.client.connect();
    }

    async onModuleDestroy() {
        await this.client.close();
    }

    /** True once connected (used by health checks). */
    isOpen(): boolean {
        return this.client.isConnected();
    }
}


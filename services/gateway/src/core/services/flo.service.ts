import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { FloClient } from '@floruntime/node';
import { ConfigService } from '@config/config.service';

const enc = new TextEncoder();
const dec = new TextDecoder();

/** Encode a value to Uint8Array for Flo KV/streams. */
export const floEncode = (v: unknown): Uint8Array =>
    typeof v === 'string' ? enc.encode(v) : enc.encode(JSON.stringify(v));

/** Decode a Flo payload to a UTF-8 string (null if missing). */
export const floDecodeStr = (v: Uint8Array | null): string | null =>
    v ? dec.decode(v) : null;

/** Decode + JSON.parse in one shot. */
export const floDecodeJson = <T = unknown>(v: Uint8Array | null): T | null => {
    if (!v) return null;
    return JSON.parse(dec.decode(v));
};

@Injectable()
export class FloService implements OnModuleInit, OnModuleDestroy {
    readonly client: FloClient;

    constructor(private readonly config: ConfigService) {
        this.client = new FloClient(this.config.FLO_ADDR, { namespace: 'propeller' });
    }

    async onModuleInit() {
        await this.client.connect();
    }

    async onModuleDestroy() {
        await this.client.close();
    }

    isOpen(): boolean {
        return this.client.isConnected();
    }

    append(stream: string, value: string | Object | Uint8Array): Promise<string> {
        return this.client.stream.append(stream, value);
    }
}

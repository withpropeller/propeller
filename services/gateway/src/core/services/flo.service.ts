import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { FloClient, StreamAppendResult } from '@floruntime/node';
import { ConfigService } from '@config/config.service';
import { retryWithBackoff } from '@core/helpers';

const enc = new TextEncoder();
const dec = new TextDecoder();

export const floEncode = (v: unknown): Uint8Array =>
    typeof v === 'string' ? enc.encode(v) : enc.encode(JSON.stringify(v));

export const floDecodeStr = (v: Uint8Array | null): string | null => (v ? dec.decode(v) : null);

export const floDecodeJson = <T = unknown>(v: Uint8Array | null): T | null => {
    if (!v) return null;
    return JSON.parse(dec.decode(v));
};

@Injectable()
export class FloService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(FloService.name);
    readonly client: FloClient;

    constructor(private readonly config: ConfigService) {
        this.client = new FloClient(this.config.FLO_ADDR, { namespace: this.config.FLO_NAMESPACE });
        this.logger.log(`Flo client created at ${this.config.FLO_ADDR} (namespace: ${this.config.FLO_NAMESPACE})`);
    }

    async onModuleInit() {
        await retryWithBackoff(() => this.client.connect(), {
            maxAttempts: 12,
            initialDelayMs: 500,
            maxDelayMs: 10_000,
            onRetry: (attempt, error) => {
                this.logger.warn(`Flo connect attempt ${attempt} failed (${this.config.FLO_ADDR}): ${error}`);
            },
        });
        this.logger.log(`Connected to Flo at ${this.config.FLO_ADDR} (namespace: ${this.config.FLO_NAMESPACE})`);
    }

    async onModuleDestroy() {
        await this.client.close();
    }

    isOpen(): boolean {
        return this.client.isConnected();
    }

    async append(stream: string, value: string | object | Uint8Array): Promise<StreamAppendResult> {
        console.log(`Appending to stream ${stream}: ${value}`);
        const namespace = this.client.getNamespace();
        console.log(`Namespace: ${namespace}`);
        const result = await this.client.stream.append(stream, value);
        console.log(`Append result: ${JSON.stringify(result)}`);
        return result;
    }
}

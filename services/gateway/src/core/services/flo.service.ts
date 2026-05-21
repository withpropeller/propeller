import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { FloClient, StreamAppendResult } from '@floruntime/node';
import { ConfigService } from '@config/config.service';
import { retryWithBackoff } from '@core/helpers';

@Injectable()
export class FloService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(FloService.name);
    readonly client: FloClient;

    constructor(private readonly config: ConfigService) {
        this.client = new FloClient(this.config.FLO_ADDR, { namespace: this.config.FLO_NAMESPACE });
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
        this.logger.log(`Connected to Flo at ${this.config.FLO_ADDR}`);
    }

    async onModuleDestroy() {
        await this.client.close();
    }

    isOpen(): boolean {
        return this.client.isConnected();
    }

    append(stream: string, value: string | object | Uint8Array): Promise<StreamAppendResult> {
        return this.client.stream.append(stream, value);
    }
}

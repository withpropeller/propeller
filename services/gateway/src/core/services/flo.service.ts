import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { FloClient, StreamAppendResult } from '@floruntime/node';
import { ConfigService } from '@config/config.service';

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

    append(stream: string, value: string | object | Uint8Array): Promise<StreamAppendResult> {
        return this.client.stream.append(stream, value);
    }
}

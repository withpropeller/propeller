import { Injectable } from '@nestjs/common';
import { FloKeys } from '@core/helpers';
import { FloService, floEncode, floDecodeJson } from '@core/services/flo.service';

export interface RegisteredAuthEmail {
    userId: string;
    registeredAt: string;
}

/**
 * Authoritative email registry in Flo KV (replaces Redis cuckoo filter).
 * Keys: auth:email:{normalizedEmail} → { userId, registeredAt }.
 */
@Injectable()
export class AuthRegistryService {
    constructor(private readonly flo: FloService) {}

    private keyFor(email: string): string {
        return `${FloKeys.AuthEmail}:${email.trim().toLowerCase()}`;
    }

    async isEmailRegistered(email: string): Promise<boolean> {
        return this.flo.client.kv.exists(this.keyFor(email));
    }

    async registerEmail(email: string, userId: string): Promise<void> {
        const payload: RegisteredAuthEmail = {
            userId,
            registeredAt: new Date().toISOString(),
        };
        await this.flo.client.kv.put(this.keyFor(email), floEncode(payload));
    }

    async getRegisteredEmail(email: string): Promise<RegisteredAuthEmail | null> {
        const result = await this.flo.client.kv.get(this.keyFor(email));
        return floDecodeJson<RegisteredAuthEmail>(result?.value ?? null);
    }
}

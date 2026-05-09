import { type NestMiddleware, Injectable } from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { RFC7807Exception } from '../exceptions/rfc7807.exception.js';

/**
 * Idempotency-Key middleware for mutating POST/PUT/PATCH endpoints.
 *
 * Reads the `Idempotency-Key` header and stores a short-lived reservation
 * in a KV store (Redis, Flo KV, or in-memory for dev). If the same key
 * arrives again with the same payload, the cached response is returned.
 * If the payload differs, a 409 conflict is returned.
 *
 * The reservation TTL should be long enough to cover request processing
 * (default 24 hours).
 *
 * Usage (AppModule):
 *   consumer.apply(IdempotencyMiddleware).forRoutes({ path: '*', method: RequestMethod.POST });
 */
export interface IdempotencyStore {
  get(key: string): Promise<{ payloadHash: string; responseBody: string; status: number } | undefined>;
  set(key: string, value: { payloadHash: string; responseBody: string; status: number }, ttlMs: number): Promise<void>;
}

@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  private readonly ttlMs = 24 * 60 * 60 * 1000; // 24 hours

  constructor(private readonly store: IdempotencyStore) {}

  async use(req: FastifyRequest, res: FastifyReply, next: () => void): Promise<void> {
    const idemKey = req.headers['idempotency-key'] as string | undefined;
    if (!idemKey) {
      // Idempotency key is optional for reads, required for mutating methods.
      if (req.method === 'GET' || req.method === 'DELETE') {
        return next();
      }
      // For Wave 2 we enforce it on all POST/PUT/PATCH.
      throw RFC7807Exception.badRequest('Idempotency-Key header is required for this request');
    }

    const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? '');
    const payloadHash = await this.hash(payload);

    const cached = await this.store.get(idemKey);
    if (cached) {
      if (cached.payloadHash !== payloadHash) {
        throw RFC7807Exception.idempotencyKeyReused(req.url);
      }
      // Return cached response
      void res.status(cached.status).send(JSON.parse(cached.responseBody));
      return;
    }

    // Reserve the key — if another concurrent request arrives with the same key
    // but hasn't finished yet, we could detect it with a "processing" sentinel.
    // For simplicity we rely on the store's atomicity (e.g., Redis SET NX).
    await this.store.set(idemKey, { payloadHash, responseBody: '', status: 0 }, this.ttlMs);

    // Patch res.send to capture the response for caching
    const originalSend = res.send.bind(res);
    (res as any).send = (payload: unknown) => {
      const status = res.statusCode ?? 200;
      const bodyStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
      // Fire-and-forget cache update
      void this.store.set(idemKey, { payloadHash, responseBody: bodyStr, status }, this.ttlMs);
      return originalSend(payload);
    };

    next();
  }

  private async hash(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

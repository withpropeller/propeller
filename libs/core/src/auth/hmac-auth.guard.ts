import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { HmacHash } from '../crypto/hmac-hash.js';
import { RFC7807Exception } from '../exceptions/rfc7807.exception.js';

/**
 * HMAC authentication guard for `apps/api` `/v1/*` routes.
 *
 * Expected header:
 *   Authorization: HMAC-SHA256 <key_id>:<signature>
 *
 * The signature is computed over:
 *   timestamp + method + path + body
 *
 * The timestamp must be within 5 minutes of server time to prevent replay.
 * The key_id is looked up in a config map or database to get the secret.
 *
 * Usage:
 *   @UseGuards(HmacAuthGuard)
 *   @Controller('v1/businesses')
 */
@Injectable()
export class HmacAuthGuard implements CanActivate {
  /** Max age of a request timestamp in milliseconds (5 minutes). */
  private readonly maxTimestampAgeMs = 5 * 60 * 1000;

  constructor(
    /** key_id → secret lookup. In production this hits a database or KV store. */
    private readonly keyStore: Map<string, string> | ((keyId: string) => Promise<string | undefined>),
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<FastifyRequest>();
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('HMAC-SHA256 ')) {
      throw RFC7807Exception.unauthorized('Missing or invalid Authorization header');
    }

    const payload = authHeader.slice('HMAC-SHA256 '.length);
    const [keyId, providedSig] = payload.split(':');
    if (!keyId || !providedSig) {
      throw RFC7807Exception.unauthorized('Malformed Authorization header');
    }

    const timestamp = req.headers['x-timestamp'] as string | undefined;
    if (!timestamp) {
      throw RFC7807Exception.unauthorized('Missing X-Timestamp header');
    }

    const tsNum = Number(timestamp);
    if (Number.isNaN(tsNum) || Math.abs(Date.now() - tsNum) > this.maxTimestampAgeMs) {
      throw RFC7807Exception.unauthorized('Request timestamp expired or invalid');
    }

    const secret = await this.resolveSecret(keyId);
    if (!secret) {
      throw RFC7807Exception.unauthorized('Invalid API key');
    }

    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? '');
    const canonical = `${timestamp}${req.method}${req.url}${body}`;
    const expectedSig = await HmacHash.hashHex(secret, canonical, 'sha256');

    if (!this.timingSafeEqual(providedSig, expectedSig)) {
      throw RFC7807Exception.unauthorized('Invalid signature');
    }

    // Stamp the request so controllers know which key is calling
    (req as any)['propeller-api-key-id'] = keyId;
    return true;
  }

  private async resolveSecret(keyId: string): Promise<string | undefined> {
    if (this.keyStore instanceof Map) {
      return this.keyStore.get(keyId);
    }
    return this.keyStore(keyId);
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}

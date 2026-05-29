import { createHmac, timingSafeEqual } from 'crypto';

/**
 * InfraToken — compact HMAC-signed token for internal service-to-service calls
 * (gateway/office → api-internal).
 *
 * Format: `<base64url(payload)>.<base64url(HMAC-SHA256)>`
 *
 * The identity claims (business/user/tenant/request) travel *inside* the signed
 * payload, so they cannot be spoofed independently of the signing key. The api
 * verifies the signature + expiry and derives the machine AccessKey from a
 * server-side constant — no Redis lookup, no trust in loose headers.
 */
export interface InfraTokenClaims {
    /** Issuing service, e.g. "gateway". */
    iss: string;
    businessId: string;
    userId?: string;
    tenantId: string;
    requestId: string;
    /** Issued-at, unix seconds. */
    iat: number;
    /** Expiry, unix seconds. */
    exp: number;
}

export type InfraTokenInput = Omit<InfraTokenClaims, 'iat' | 'exp'>;

export class InfraToken {
    /** Short-lived by design — these tokens are minted per request. */
    static readonly DEFAULT_TTL_SECONDS = 60;

    static sign(claims: InfraTokenInput, secret: string, ttlSeconds = InfraToken.DEFAULT_TTL_SECONDS): string {
        if (!secret) {
            throw new Error('InfraToken.sign: missing signing secret');
        }

        const iat = Math.floor(Date.now() / 1000);
        const payload: InfraTokenClaims = { ...claims, iat, exp: iat + ttlSeconds };
        const body = Buffer.from(JSON.stringify(payload)).toString('base64url');

        return `${body}.${InfraToken.hmac(body, secret)}`;
    }

    /**
     * Verify against any of the provided secrets (current + previous) to support
     * zero-downtime key rotation. Throws on malformed / bad-signature / expired.
     */
    static verify(token: string, secrets: string[]): InfraTokenClaims {
        const usable = (secrets ?? []).filter(Boolean);
        if (usable.length === 0) {
            throw new Error('InfraToken.verify: no signing secrets configured');
        }

        const [body, signature] = (token ?? '').split('.');
        if (!body || !signature) {
            throw new Error('InfraToken.verify: malformed token');
        }

        const signatureValid = usable.some((secret) => InfraToken.safeEqual(signature, InfraToken.hmac(body, secret)));
        if (!signatureValid) {
            throw new Error('InfraToken.verify: invalid signature');
        }

        let claims: InfraTokenClaims;
        try {
            claims = JSON.parse(Buffer.from(body, 'base64url').toString());
        } catch {
            throw new Error('InfraToken.verify: malformed payload');
        }

        const now = Math.floor(Date.now() / 1000);
        if (typeof claims.exp !== 'number' || claims.exp < now) {
            throw new Error('InfraToken.verify: expired token');
        }

        return claims;
    }

    private static hmac(body: string, secret: string): string {
        return createHmac('sha256', secret).update(body).digest('base64url');
    }

    private static safeEqual(a: string, b: string): boolean {
        const ab = Buffer.from(a);
        const bb = Buffer.from(b);
        if (ab.length !== bb.length) {
            return false;
        }
        return timingSafeEqual(ab, bb);
    }
}

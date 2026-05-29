import { describe, expect, it } from 'vitest';
import { InfraToken, type InfraTokenInput } from './infra-token.js';

describe('InfraToken', () => {
    const secret = 'unit-test-signing-secret';
    const claims: InfraTokenInput = {
        iss: 'gateway',
        businessId: '507f1f77bcf86cd799439011',
        userId: '507f191e810c19729de860ea',
        tenantId: 'live-db',
        requestId: 'aaaaaaaaaaaaaaaaaaaaaaaa',
    };

    it('signs and verifies a token round-trip', () => {
        const token = InfraToken.sign(claims, secret);
        const decoded = InfraToken.verify(token, [secret]);

        expect(decoded.businessId).toBe(claims.businessId);
        expect(decoded.userId).toBe(claims.userId);
        expect(decoded.tenantId).toBe(claims.tenantId);
        expect(decoded.requestId).toBe(claims.requestId);
        expect(decoded.iss).toBe('gateway');
        expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    it('rejects a token signed with a different secret', () => {
        const token = InfraToken.sign(claims, secret);
        expect(() => InfraToken.verify(token, ['wrong-secret'])).toThrow(/invalid signature/);
    });

    it('rejects a tampered payload', () => {
        const token = InfraToken.sign(claims, secret);
        const [body, sig] = token.split('.');
        const forged = Buffer.from(
            JSON.stringify({ ...claims, businessId: 'deadbeefdeadbeefdeadbeef', iat: 1, exp: 9999999999 }),
        ).toString('base64url');
        expect(() => InfraToken.verify(`${forged}.${sig}`, [secret])).toThrow(/invalid signature/);
        // sanity: original still valid
        expect(InfraToken.verify(`${body}.${sig}`, [secret]).businessId).toBe(claims.businessId);
    });

    it('rejects an expired token', () => {
        const token = InfraToken.sign(claims, secret, -1);
        expect(() => InfraToken.verify(token, [secret])).toThrow(/expired/);
    });

    it('rejects malformed tokens', () => {
        expect(() => InfraToken.verify('', [secret])).toThrow(/malformed/);
        expect(() => InfraToken.verify('no-dot-here', [secret])).toThrow(/malformed/);
    });

    it('accepts the previous secret during rotation', () => {
        const previous = 'previous-signing-secret';
        const current = 'current-signing-secret';
        const tokenFromOld = InfraToken.sign(claims, previous);

        // api verifies against [current, previous]
        expect(InfraToken.verify(tokenFromOld, [current, previous]).businessId).toBe(claims.businessId);
    });

    it('throws when no secrets are configured', () => {
        const token = InfraToken.sign(claims, secret);
        expect(() => InfraToken.verify(token, [])).toThrow(/no signing secrets/);
        expect(() => InfraToken.verify(token, [''])).toThrow(/no signing secrets/);
    });
});

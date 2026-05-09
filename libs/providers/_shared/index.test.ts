import { describe, it, expect } from 'vitest';
import { verifyHmacSignature, generateHmacSignature, generateNonce, generateTimestampMillis } from './index.js';

describe('shared provider utilities', () => {
    describe('HMAC', () => {
        it('generates and verifies HMAC signatures', () => {
            const secret = 'test-secret';
            const payload = '{"event":"test"}';

            const sig = generateHmacSignature(secret, payload);
            expect(sig).toBeTruthy();
            expect(typeof sig).toBe('string');

            expect(verifyHmacSignature(secret, payload, sig)).toBe(true);
            expect(verifyHmacSignature(secret, payload, 'bad-sig')).toBe(false);
            expect(verifyHmacSignature('wrong-secret', payload, sig)).toBe(false);
        });
    });

    describe('nonce', () => {
        it('generates random nonces', () => {
            const n1 = generateNonce(16);
            const n2 = generateNonce(16);

            expect(n1).toBeTruthy();
            expect(n1).not.toBe(n2); // statistically should be unique
        });
    });

    describe('timestamp', () => {
        it('generates millisecond timestamps', () => {
            const ts = generateTimestampMillis();
            expect(ts).toBeTruthy();
            expect(Number(ts)).toBeGreaterThan(1_700_000_000_000); // after 2023
        });
    });
});

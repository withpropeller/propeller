import { describe, it, expect } from 'vitest';
import { createPrivateKey, createPublicKey, generateKeyPairSync, createSign, createVerify } from 'node:crypto';
import { PayKKaProvider } from './index.js';

// Generate test key pair for fixtures
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const config = {
    PAYKKA_BASE_URL: 'https://open-fat.cb.paykka.com',
    PAYKKA_PRIVATE_KEY_PEM: privateKey,
    PAYKKA_PUBLIC_KEY_PEM: publicKey,
    PAYKKA_KEY_ID: 'test-key-id',
    PAYKKA_MERCH_ID: 'M24061911365700670',
};

describe('PayKKaProvider', () => {
    describe('constructor', () => {
        it('creates provider with valid config', () => {
            const provider = new PayKKaProvider({ config });
            expect(provider.name).toBe('paykka');
        });

        it('throws if PRIVATE_KEY is missing', () => {
            expect(() => new PayKKaProvider({ config: { ...config, PAYKKA_PRIVATE_KEY_PEM: '' } })).toThrow(
                'PAYKKA_PRIVATE_KEY_PEM not set',
            );
        });

        it('throws if PUBLIC_KEY is missing', () => {
            expect(() => new PayKKaProvider({ config: { ...config, PAYKKA_PUBLIC_KEY_PEM: '' } })).toThrow(
                'PAYKKA_PUBLIC_KEY_PEM not set',
            );
        });
    });

    describe('signing', () => {
        it('signRequest produces valid Authorization header', async () => {
            const provider = new PayKKaProvider({ config });

            // Access private method via prototype for testing
            const authHeader = await (provider as any).signRequest(
                '/api/v2/merch/assessment/apply',
                { request_id: 'test-123' },
                '', // no merch ID for assessment apply
            );

            expect(authHeader).toBeTruthy();
            expect(typeof authHeader).toBe('string');

            // Decode and verify structure
            const decoded = decodeURIComponent(authHeader);
            const parsed = JSON.parse(decoded);
            expect(parsed.sign_type).toBe('SHA256_WITH_RSA');
            expect(parsed.key_id).toBe('test-key-id');
            expect(parsed.signature).toBeTruthy();
            expect(parsed.timestamp).toBeTruthy();
            expect(parsed.nonce).toBeTruthy();
        });

        it('verifyCallbackSignature validates a real signature', () => {
            const provider = new PayKKaProvider({ config });

            const path = '/paykka';
            const merchId = 'M24061911365700670';
            const rawBody = JSON.stringify({
                type: 'ASSESSMENT',
                version: 'V2',
                data: { request_id: 'req-1', merch_id: merchId, status: 'PASS', risk_level: 'LOW' },
            });
            const timestamp = Date.now().toString();
            const nonce = 'abcdef123456';

            // PayKKa's 5-line canonical string: path \n timestamp \n nonce \n merch_id \n body
            const canonical = `${path}\n${timestamp}\n${nonce}\n${merchId}\n${rawBody}`;
            const sign = createSign('SHA256');
            sign.update(canonical);
            sign.end();
            const sig = sign.sign(privateKey, 'base64');

            const authHeader = encodeURIComponent(
                JSON.stringify({
                    sign_type: 'SHA256_WITH_RSA',
                    timestamp,
                    nonce,
                    key_id: 'test-key-id',
                    signature: sig,
                }),
            );

            // Should verify with the correct path + merch_id + body
            expect(provider.verifyCallbackSignature({ path, merchId, signature: authHeader, rawBody })).toBe(true);

            // Should reject tampered body
            expect(
                provider.verifyCallbackSignature({ path, merchId, signature: authHeader, rawBody: '{"tampered":true}' }),
            ).toBe(false);

            // Should reject a mismatched path
            expect(
                provider.verifyCallbackSignature({ path: '/webhooks/other', merchId, signature: authHeader, rawBody }),
            ).toBe(false);
        });
    });

    describe('callback rejection', () => {
        it('rejects unsigned or malformed callbacks', () => {
            const provider = new PayKKaProvider({ config });
            const base = { path: '/paykka', merchId: 'M123', rawBody: '{}' };
            expect(provider.verifyCallbackSignature({ ...base, signature: 'not-valid-json' })).toBe(false);
            expect(provider.verifyCallbackSignature({ ...base, signature: '' })).toBe(false);
        });
    });
});

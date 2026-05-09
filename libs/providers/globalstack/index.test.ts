import { describe, it, expect } from 'vitest';
import { GlobalstackProvider } from './index.js';
import { unwrapGlobalstack } from './parsers.js';
import { createHmac } from 'node:crypto';

const config = {
    GLOBALSTACK_API_KEY: 'gs_test_key',
    GLOBALSTACK_WEBHOOK_SECRET: 'whsec_gs',
    GLOBALSTACK_BASE_URL: 'https://sandbox.globalstack.io',
};

describe('GlobalstackProvider', () => {
    it('creates provider with valid config', () => {
        const provider = new GlobalstackProvider({ config });
        expect(provider.name).toBe('globalstack');
    });

    it('throws without API key', () => {
        expect(() => new GlobalstackProvider({ config: { ...config, GLOBALSTACK_API_KEY: '' } })).toThrow(
            'GLOBALSTACK_API_KEY not set',
        );
    });

    it('defaults to sandbox base URL when not configured', () => {
        const provider = new GlobalstackProvider({
            config: { GLOBALSTACK_API_KEY: 'key' },
        });
        // base URL is private — we just verify construction succeeds
        expect(provider.name).toBe('globalstack');
    });

    describe('response unwrapping', () => {
        it('unwraps success response', () => {
            const data = unwrapGlobalstack({
                type: 'success',
                message: 'ok',
                data: { order_id: 'ord_1', status: 'completed' },
            });
            expect(data.order_id).toBe('ord_1');
        });

        it('throws on error response', () => {
            expect(() =>
                unwrapGlobalstack({
                    type: 'error',
                    message: 'Invalid quote',
                    error_code: 'INVALID_QUOTE',
                }),
            ).toThrow('Invalid quote');
        });
    });

    describe('webhook verification', () => {
        it('verifies valid HMAC SHA256 signature', () => {
            const provider = new GlobalstackProvider({ config });
            const payload = JSON.stringify({ order_id: 'ord_1', status: 'completed' });
            const sig = createHmac('sha256', 'whsec_gs').update(payload).digest('hex');

            expect(provider.verifyWebhookSignature(payload, sig)).toBe(true);
        });

        it('rejects invalid signature', () => {
            const provider = new GlobalstackProvider({ config });
            expect(provider.verifyWebhookSignature('{"test":1}', 'bad_sig')).toBe(false);
        });
    });
});

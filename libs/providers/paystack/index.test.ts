import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { PaystackProvider } from './index.js';

// ── Fixture: mock fetch ──

function mockFetch(response: unknown, status = 200) {
    return vi.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        text: async () => JSON.stringify(response),
        json: async () => response,
    });
}

const config = {
    PAYSTACK_SECRET_KEY: 'sk_test_fixture',
    PAYSTACK_WEBHOOK_SECRET: 'whsec_test',
};

describe('PaystackProvider', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe('createCharge', () => {
        it('returns charge details on success', async () => {
            const mockRes = {
                status: true,
                message: 'Charge attempted',
                data: {
                    reference: 'ref_abc123',
                    account_number: '1260257501',
                    account_name: 'TEST-MANAGED-ACCOUNT',
                    bank: { slug: 'test-bank', name: 'Test Bank', id: 24 },
                    account_expires_at: '2025-06-01T12:00:00.000Z',
                },
            };

            global.fetch = mockFetch(mockRes);
            const provider = new PaystackProvider({ config });

            const charge = await provider.createCharge({
                email: 'test@example.com',
                amount: 10000,
                bank_transfer: { account_expires_at: '2025-06-01T12:00:00.000Z' },
            });

            expect(charge.reference).toBe('ref_abc123');
            expect(charge.account_number).toBe('1260257501');
            expect(charge.bank.slug).toBe('test-bank');
        });

        it('throws on Paystack error response', async () => {
            global.fetch = mockFetch(
                { status: false, message: 'Invalid amount' },
                200, // Paystack returns 200 even for business errors
            );

            const provider = new PaystackProvider({ config });

            await expect(
                provider.createCharge({
                    email: 'test@example.com',
                    amount: 5,
                    bank_transfer: { account_expires_at: '2025-06-01T12:00:00.000Z' },
                }),
            ).rejects.toThrow();
        });
    });

    describe('webhook verification', () => {
        it('verifies valid HMAC SHA512 signature', () => {
            const provider = new PaystackProvider({ config });
            const payload = JSON.stringify({ event: 'charge.success', data: { reference: 'ref_1', amount: 10000 } });
            const expectedSig = createHmac('sha512', 'whsec_test').update(payload).digest('hex');

            expect(provider.verifyWebhookSignature(payload, expectedSig)).toBe(true);
        });

        it('rejects invalid signature', () => {
            const provider = new PaystackProvider({ config });
            expect(provider.verifyWebhookSignature('{"event":"charge.success"}', 'bad_signature')).toBe(false);
        });
    });

    describe('parseWebhook', () => {
        it('parses charge.success event', () => {
            const provider = new PaystackProvider({ config });
            const event = provider.parseWebhook({
                event: 'charge.success',
                data: {
                    reference: 'ref_xyz',
                    amount: 25000,
                    currency: 'NGN',
                    paid_at: '2025-06-01T12:00:00.000Z',
                    authorization: {
                        sender_name: 'John Doe',
                        sender_bank_account_number: 'XXXXXXX553',
                        sender_country: 'NG',
                    },
                },
            });

            expect(event.type).toBe('charge.success');
            if (event.type === 'charge.success') {
                expect(event.reference).toBe('ref_xyz');
                expect(event.amount).toBe(25000);
                expect(event.senderName).toBe('John Doe');
            }
        });

        it('parses bank.transfer.rejected event', () => {
            const provider = new PaystackProvider({ config });
            const event = provider.parseWebhook({
                event: 'bank.transfer.rejected',
                data: {
                    bank_transfer: {
                        amount: '30000',
                        message: 'incorrect amount sent',
                        message_type: 'INCORRECT_AMOUNT',
                        transaction_id: 'ref_bad',
                    },
                },
            });

            expect(event.type).toBe('bank.transfer.rejected');
            if (event.type === 'bank.transfer.rejected') {
                expect(event.messageType).toBe('INCORRECT_AMOUNT');
                expect(event.reference).toBe('ref_bad');
            }
        });

        it('throws on unknown event', () => {
            const provider = new PaystackProvider({ config });
            expect(() =>
                provider.parseWebhook({ event: 'unknown.event', data: {} }),
            ).toThrow('Unknown Paystack webhook event');
        });
    });
});

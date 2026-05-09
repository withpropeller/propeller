// ──────────────────────────────────────────────────────────────
// Paystack Provider Adapter — Virtual Account (PWT)
// ──────────────────────────────────────────────────────────────
// Implements VirtualAccountProvider for Paystack's
// Pay With Transfer (PWT) feature.
//
// Auth: Bearer <secret_key>
// Webhooks: HMAC SHA512 (x-paystack-signature header)
// ──────────────────────────────────────────────────────────────

import type {
    PaystackChargeRequest,
    PaystackChargeResponse,
    PaystackWebhookPayload,
    PaystackWebhookEvent,
    VirtualAccountProvider,
    ProviderInitOptions,
} from '../../contracts/providers.js';
import { BaseProviderClient, ProviderAuthError } from '../_shared/index.js';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { parsePaystackWebhook } from './parsers.js';

export class PaystackProvider extends BaseProviderClient implements VirtualAccountProvider {
    private readonly secretKey: string;
    private readonly webhookSecret: string;

    constructor(opts: ProviderInitOptions) {
        const secretKey = opts.config.PAYSTACK_SECRET_KEY;
        if (!secretKey) throw new ProviderAuthError('paystack', 'PAYSTACK_SECRET_KEY not set');

        super('paystack', {
            baseUrl: 'https://api.paystack.co',
            headers: {
                Authorization: `Bearer ${secretKey}`,
            },
            timeoutMs: 20_000,
        });

        this.secretKey = secretKey;
        this.webhookSecret = opts.config.PAYSTACK_WEBHOOK_SECRET ?? '';
    }

    // ── VirtualAccountProvider impl ──

    async createCharge(req: PaystackChargeRequest): Promise<PaystackChargeResponse> {
        const data = await this.request<{
            status: boolean;
            message: string;
            data: Record<string, unknown>;
        }>({
            method: 'POST',
            path: '/charge',
            body: {
                email: req.email,
                amount: String(req.amount),
                bank_transfer: {
                    account_expires_at: req.bank_transfer.account_expires_at,
                },
                metadata: req.metadata,
            },
        });

        if (!data.status) {
            throw ProviderAuthError; // reusing — Paystack returns status: false for business errors too
        }

        const d = data.data;
        return {
            reference: d.reference as string,
            account_number: d.account_number as string,
            account_name: d.account_name as string,
            bank: d.bank as { slug: string; name: string; id?: number },
            account_expires_at: d.account_expires_at as string,
        };
    }

    async checkPendingCharge(reference: string): Promise<PaystackChargeResponse> {
        const data = await this.request<{
            status: boolean;
            message: string;
            data: Record<string, unknown>;
        }>({
            method: 'GET',
            path: `/charge/${reference}`,
        });

        if (!data.status) {
            throw ProviderAuthError;
        }

        const d = data.data;
        return {
            reference: d.reference as string,
            account_number: d.account_number as string,
            account_name: d.account_name as string,
            bank: d.bank as { slug: string; name: string; id?: number },
            account_expires_at: d.account_expires_at as string,
        };
    }

    verifyWebhookSignature(payload: string, signature: string): boolean {
        if (!this.webhookSecret) {
            throw new Error('PAYSTACK_WEBHOOK_SECRET not configured');
        }

        try {
            const expected = createHmac('sha512', this.webhookSecret)
                .update(payload)
                .digest('hex');

            const sigBuf = Buffer.from(signature, 'hex');
            const expectedBuf = Buffer.from(expected, 'hex');

            if (sigBuf.length !== expectedBuf.length) return false;
            return timingSafeEqual(sigBuf, expectedBuf);
        } catch {
            return false;
        }
    }

    parseWebhook(payload: PaystackWebhookPayload): PaystackWebhookEvent {
        return parsePaystackWebhook(payload);
    }
}

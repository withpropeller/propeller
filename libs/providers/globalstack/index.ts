// ──────────────────────────────────────────────────────────────
// Globalstack (Passport) Provider Adapter — Off-Ramp
// ──────────────────────────────────────────────────────────────
// Implements OffRampProvider for Globalstack's FX API.
//
// Auth: Bearer <api-key>
// Base: https://api.globalstack.io (prod) / https://sandbox.globalstack.io (sandbox)
// Response format: { type: "success" | "error", message, data/error_code }
// Webhooks: HMAC on settlement notifications
//
// USDC on Ethereum, Base, Solana → 18 African countries
// ──────────────────────────────────────────────────────────────

import type {
    GlobalstackQuoteRequest,
    GlobalstackQuoteResponse,
    GlobalstackOrderRequest,
    GlobalstackOrderResponse,
    OffRampProvider,
    ProviderInitOptions,
} from '../../contracts/providers.js';
import { BaseProviderClient, ProviderAuthError, verifyHmacSignature } from '../_shared/index.js';
import { unwrapGlobalstack, type GlobalstackResponse } from './parsers.js';

export class GlobalstackProvider extends BaseProviderClient implements OffRampProvider {
    private readonly apiKey: string;
    private readonly webhookSecret: string;

    constructor(opts: ProviderInitOptions) {
        const apiKey = opts.config.GLOBALSTACK_API_KEY;
        if (!apiKey) throw new ProviderAuthError('globalstack', 'GLOBALSTACK_API_KEY not set');

        const baseUrl = opts.config.GLOBALSTACK_BASE_URL ?? 'https://sandbox.globalstack.io';

        super('globalstack', {
            baseUrl,
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
            timeoutMs: 30_000,
        });

        this.apiKey = apiKey;
        this.webhookSecret = opts.config.GLOBALSTACK_WEBHOOK_SECRET ?? '';
    }

    // ── OffRampProvider impl ──

    async getQuote(req: GlobalstackQuoteRequest): Promise<GlobalstackQuoteResponse> {
        const res = await this.request<GlobalstackResponse<{
            quote_id: string;
            rate: number;
            source_amount: number;
            target_amount: number;
            expires_at: string;
        }>>({
            method: 'POST',
            path: '/v1/quote',
            body: {
                source_currency: req.source_currency,
                target_currency: req.target_currency,
                source_amount: req.source_amount,
                target_amount: req.target_amount,
            },
        });

        const data = unwrapGlobalstack(res);
        return {
            quote_id: data.quote_id,
            rate: data.rate,
            source_amount: data.source_amount,
            target_amount: data.target_amount,
            expires_at: data.expires_at,
        };
    }

    async placeOrder(req: GlobalstackOrderRequest): Promise<GlobalstackOrderResponse> {
        const res = await this.request<GlobalstackResponse<{
            order_id: string;
            status: string;
        }>>({
            method: 'POST',
            path: '/v1/orders',
            body: {
                quote_id: req.quote_id,
                account_number: req.account_number,
                bank_code: req.bank_code,
                account_name: req.account_name,
                idempotency_key: req.idempotency_key,
            },
        });

        const data = unwrapGlobalstack(res);
        return {
            order_id: data.order_id,
            status: data.status as GlobalstackOrderResponse['status'],
        };
    }

    async getOrderStatus(orderId: string): Promise<GlobalstackOrderResponse> {
        const res = await this.request<GlobalstackResponse<{
            order_id: string;
            status: string;
        }>>({
            method: 'GET',
            path: `/v1/orders/${orderId}`,
        });

        const data = unwrapGlobalstack(res);
        return {
            order_id: data.order_id,
            status: data.status as GlobalstackOrderResponse['status'],
        };
    }

    verifyWebhookSignature(payload: string, signature: string): boolean {
        if (!this.webhookSecret) {
            throw new Error('GLOBALSTACK_WEBHOOK_SECRET not configured');
        }
        return verifyHmacSignature(this.webhookSecret, payload, signature, 'sha256');
    }
}

// ──────────────────────────────────────────────────────────────
// Dojah Provider Adapter — Customer KYC
// ──────────────────────────────────────────────────────────────
// Implements CustomerKycProvider for Dojah's Identity Hub.
//
// Auth: App ID + Secret Key (basic or header-based)
// Webhooks: HMAC signature verification
// Widget: session create → embed via Dojah JS SDK in apps/dashboard
// ──────────────────────────────────────────────────────────────

import type {
    DojahSessionRequest,
    DojahSessionResponse,
    DojahWebhookPayload,
    CustomerKycProvider,
    ProviderInitOptions,
} from '../../contracts/providers.js';
import { BaseProviderClient, ProviderAuthError, verifyHmacSignature, generateHmacSignature } from '../_shared/index.js';

export class DojahProvider extends BaseProviderClient implements CustomerKycProvider {
    private readonly appId: string;
    private readonly secretKey: string;
    private readonly webhookSecret: string;

    constructor(opts: ProviderInitOptions) {
        const appId = opts.config.DOJAH_APP_ID;
        const secretKey = opts.config.DOJAH_SECRET_KEY;
        if (!appId) throw new ProviderAuthError('dojah', 'DOJAH_APP_ID not set');
        if (!secretKey) throw new ProviderAuthError('dojah', 'DOJAH_SECRET_KEY not set');

        // Dojah base URL is typically provided in the dashboard; fallback to generic
        const baseUrl = opts.config.DOJAH_BASE_URL ?? 'https://api.dojah.io';

        super('dojah', {
            baseUrl,
            headers: {
                AppId: appId,
                Authorization: `Bearer ${secretKey}`,
            },
            timeoutMs: 30_000,
        });

        this.appId = appId;
        this.secretKey = secretKey;
        this.webhookSecret = opts.config.DOJAH_WEBHOOK_SECRET ?? '';
    }

    // ── CustomerKycProvider impl ──

    async createSession(req: DojahSessionRequest): Promise<DojahSessionResponse> {
        const data = await this.request<{
            entity: Record<string, unknown>;
        }>({
            method: 'POST',
            path: '/api/v1/kyc/session',
            body: {
                reference: req.reference,
                email: req.email,
                redirect_url: req.redirect_url,
                allowed_id_types: req.allowed_id_types,
            },
        });

        const e = data.entity;
        return {
            reference_id: e.reference_id as string,
            widget_token: e.widget_token as string,
            public_key: e.public_key as string,
            expires_at: e.expires_at as string,
        };
    }

    async getResult(referenceId: string): Promise<DojahWebhookPayload> {
        const data = await this.request<{
            entity: {
                reference_id: string;
                status: string;
                verification_data: Record<string, unknown>;
            };
        }>({
            method: 'GET',
            path: `/api/v1/kyc/result/${referenceId}`,
        });

        return {
            reference_id: data.entity.reference_id,
            status: data.entity.status as DojahWebhookPayload['status'],
            verification_data: {
                full_name: data.entity.verification_data.full_name as string | undefined,
                dob: data.entity.verification_data.dob as string | undefined,
                country: data.entity.verification_data.country as string | undefined,
                doc_type: data.entity.verification_data.doc_type as string | undefined,
                doc_number_masked: data.entity.verification_data.doc_number_masked as string | undefined,
                liveness_score: data.entity.verification_data.liveness_score as number | undefined,
            },
        };
    }

    verifyWebhookSignature(payload: string, signature: string): boolean {
        if (!this.webhookSecret) {
            throw new Error('DOJAH_WEBHOOK_SECRET not configured');
        }
        return verifyHmacSignature(this.webhookSecret, payload, signature, 'sha256');
    }
}

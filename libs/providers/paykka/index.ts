// ──────────────────────────────────────────────────────────────
// PayKKa Provider Adapter — Merchant KYB (Onboarding)
// ──────────────────────────────────────────────────────────────
// Implements MerchantKybProvider for PayKKa's
// merchant onboarding platform.
//
// Auth: RSA SHA256 signature in Authorization header
// File upload: RSA signature + X-Merch-Id header
// Callbacks: verify inbound RSA signature with PayKKa pub key
// ──────────────────────────────────────────────────────────────

import { createPrivateKey, createPublicKey, type KeyObject } from 'node:crypto';
import type {
    PayKKaOnboardRequest,
    PayKKaAssessmentResponse,
    PayKKaAssessmentResult,
    PayKKaCallbackVerifyInput,
    MerchantKybProvider,
    ProviderInitOptions,
} from '../../contracts/providers.js';
import { BaseProviderClient, ProviderAuthError, generateNonce, generateTimestampMillis } from '../_shared/index.js';
import { buildCanonicalString, signRsaSha256, verifyRsaSha256, buildAuthorizationHeader } from './signing.js';

// ── Provider ──

export class PayKKaProvider extends BaseProviderClient implements MerchantKybProvider {
    private readonly privateKey: KeyObject;
    private readonly publicKey: KeyObject; // PayKKa's public key for inbound callback verification
    private readonly keyId: string;
    private readonly merchId: string;

    constructor(opts: ProviderInitOptions) {
        const baseUrl = opts.config.PAYKKA_BASE_URL ?? 'https://open-fat.cb.paykka.com';
        const privateKeyPem = opts.config.PAYKKA_PRIVATE_KEY_PEM;
        const publicKeyPem = opts.config.PAYKKA_PUBLIC_KEY_PEM;
        const keyId = opts.config.PAYKKA_KEY_ID;
        const merchId = opts.config.PAYKKA_MERCH_ID ?? '';

        if (!privateKeyPem) throw new ProviderAuthError('paykka', 'PAYKKA_PRIVATE_KEY_PEM not set');
        if (!publicKeyPem) throw new ProviderAuthError('paykka', 'PAYKKA_PUBLIC_KEY_PEM not set');
        if (!keyId) throw new ProviderAuthError('paykka', 'PAYKKA_KEY_ID not set');

        super('paykka', {
            baseUrl,
            timeoutMs: 30_000,
        });

        this.privateKey = createPrivateKey({ key: privateKeyPem, format: 'pem', type: 'pkcs8' });
        this.publicKey = createPublicKey({ key: publicKeyPem, format: 'pem', type: 'spki' });
        this.keyId = keyId;
        this.merchId = merchId;
    }

    // ── Signing helpers ──

    /**
     * Sign a request and return the Authorization header value.
     *
     * @param path   — request path (e.g., /api/v2/merch/onboard/apply)
     * @param body   — raw JSON request body, or null for GET requests
     * @param merchIdOverride — override merch_id in canonical string (empty string = no merch)
     */
    private async signRequest(
        path: string,
        body: unknown,
        merchIdOverride?: string,
    ): Promise<string> {
        const timestamp = generateTimestampMillis();
        const nonce = generateNonce(16);
        const merchId = merchIdOverride ?? this.merchId;
        const bodyStr = body !== null && body !== undefined ? JSON.stringify(body) : null;
        const canonical = buildCanonicalString(path, timestamp, nonce, merchId, bodyStr);
        const signature = signRsaSha256(this.privateKey, canonical);
        return buildAuthorizationHeader(timestamp, nonce, this.keyId, signature);
    }

    // ── MerchantKybProvider impl ──

    async uploadFile(fileName: string, fileData: Buffer): Promise<number> {
        // PayKKa file upload uses RSA + X-Merch-Id
        const authHeader = await this.signRequest('/api/file/upload', null, this.merchId);

        // Note: file upload is multipart, not JSON. For now we stub the interface;
        // actual multipart implementation added when we have file upload details.
        const data = await this.request<{ data: { file_id: number } }>({
            method: 'POST',
            path: '/api/file/upload',
            headers: {
                Authorization: authHeader,
                'X-Merch-Id': this.merchId,
                'Content-Type': 'multipart/form-data',
            },
            body: { file_name: fileName, file_data: fileData.toString('base64') },
        });

        return data.data.file_id;
    }

    async submitAssessment(req: PayKKaOnboardRequest): Promise<PayKKaAssessmentResponse> {
        // PayKKa explicitly says: do NOT pass X-Merch-Id for this endpoint
        const authHeader = await this.signRequest('/api/v2/merch/assessment/apply', req, '');

        const data = await this.request<PayKKaAssessmentResponse>({
            method: 'POST',
            path: '/api/v2/merch/assessment/apply',
            headers: {
                Authorization: authHeader,
                // deliberately NO X-Merch-Id
            },
            body: req,
        });

        return data;
    }

    async getAssessmentResult(merchId: string): Promise<PayKKaAssessmentResult> {
        const authHeader = await this.signRequest('/api/v2/merch/assessment/result', { merch_id: merchId }, merchId);

        const data = await this.request<PayKKaAssessmentResult>({
            method: 'POST',
            path: '/api/v2/merch/assessment/result',
            headers: {
                Authorization: authHeader,
                'X-Merch-Id': merchId,
            },
            body: { merch_id: merchId },
        });

        return data;
    }

    async updateAssessment(merchId: string, req: Partial<PayKKaOnboardRequest>): Promise<void> {
        const body = { merch_id: merchId, ...req };
        const authHeader = await this.signRequest('/api/v2/merch/assessment/update', body, merchId);

        await this.request({
            method: 'POST',
            path: '/api/v2/merch/assessment/update',
            headers: {
                Authorization: authHeader,
                'X-Merch-Id': merchId,
            },
            body,
        });
    }

    verifyCallbackSignature(input: PayKKaCallbackVerifyInput): boolean {
        // PayKKa signs their callback with their private key; we verify with their
        // public key. The signature metadata is the same URL-encoded JSON object we
        // send outbound, carried in the Authorization header.
        try {
            const decoded = decodeURIComponent(input.signature);
            const auth = JSON.parse(decoded) as {
                sign_type: string;
                timestamp: string;
                nonce: string;
                key_id: string;
                signature: string;
            };

            // Canonical string is the same 5-line structure PayKKa uses everywhere:
            //   path \n timestamp \n nonce \n merch_id \n body
            // (the merch_id line is kept even when empty).
            const canonical = buildCanonicalString(
                input.path,
                auth.timestamp,
                auth.nonce,
                input.merchId,
                input.rawBody,
            );
            return verifyRsaSha256(this.publicKey, canonical, auth.signature);
        } catch {
            return false;
        }
    }
}

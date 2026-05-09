// ──────────────────────────────────────────────────────────────
// Shared provider base classes — used by all provider adapters
// ──────────────────────────────────────────────────────────────

import { AppException } from '../../core/src/exceptions/app.exception.js';
import { Utils } from '../../core/src/helpers/utils.js';

// ── Types ──

export interface ProviderHttpOptions {
    baseUrl: string;
    timeoutMs?: number;
    retries?: number;
    /** Additional headers sent on every request. */
    headers?: Record<string, string>;
}

interface RequestOptions {
    path: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    headers?: Record<string, string>;
    timeoutMs?: number;
}

// ── Errors ──

export class ProviderHttpError extends AppException {
    constructor(
        message: string,
        public readonly statusCode: number,
        public readonly provider: string,
        public readonly responseBody?: unknown,
    ) {
        super(null, message, 'PROVIDER_HTTP_ERROR', statusCode >= 500 ? 502 : 502);
    }
}

export class ProviderAuthError extends AppException {
    constructor(provider: string, message = 'Provider authentication failed') {
        super(null, message, 'PROVIDER_AUTH_ERROR', 502);
    }
}

export class ProviderTimeoutError extends AppException {
    constructor(provider: string, path: string, timeoutMs: number) {
        super(null, `${provider} request to ${path} timed out after ${timeoutMs}ms`, 'PROVIDER_TIMEOUT', 504);
    }
}

// ── Base HTTP Client ──

export class BaseProviderClient {
    protected readonly baseUrl: string;
    protected readonly timeoutMs: number;
    protected readonly maxRetries: number;
    protected readonly defaultHeaders: Record<string, string>;

    constructor(public readonly name: string, opts: ProviderHttpOptions) {
        this.baseUrl = opts.baseUrl.replace(/\/$/, '');
        this.timeoutMs = opts.timeoutMs ?? 15_000;
        this.maxRetries = opts.retries ?? 2;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...opts.headers,
        };
    }

    /** Build the full URL for a path. */
    protected url(path: string): string {
        return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    }

    /** Send an HTTP request with retry + timeout. */
    protected async request<T = unknown>(opts: RequestOptions): Promise<T> {
        const url = this.url(opts.path);
        const timeout = opts.timeoutMs ?? this.timeoutMs;

        let lastError: Error | undefined;

        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), timeout);

                const res = await fetch(url, {
                    method: opts.method ?? 'GET',
                    headers: { ...this.defaultHeaders, ...opts.headers },
                    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
                    signal: controller.signal,
                });

                clearTimeout(timer);

                const text = await res.text();
                let data: unknown;
                try {
                    data = JSON.parse(text);
                } catch {
                    data = text;
                }

                if (!res.ok) {
                    throw new ProviderHttpError(
                        `${this.name} returned ${res.status}`,
                        res.status,
                        this.name,
                        data,
                    );
                }

                return data as T;
            } catch (err) {
                lastError = err as Error;

                // Don't retry on auth errors or 4xx
                if (err instanceof ProviderHttpError && err.statusCode < 500) {
                    throw err;
                }
                if (err instanceof DOMException && err.name === 'AbortError') {
                    throw new ProviderTimeoutError(this.name, opts.path, timeout);
                }
                if (attempt === this.maxRetries) {
                    throw err;
                }

                // Exponential backoff
                const delay = Math.min(1000 * 2 ** attempt, 10_000);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }

        throw lastError ?? new Error(`${this.name}: request failed`);
    }

    /** Healthcheck: hit a liveness endpoint. */
    async healthcheck(): Promise<boolean> {
        try {
            await this.request({ path: '/', timeoutMs: 5_000 });
            return true;
        } catch {
            return false;
        }
    }
}

// ── Crypto helpers for provider signing ──

import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyHmacSignature(
    secret: string,
    payload: string,
    signature: string,
    algorithm = 'sha512',
): boolean {
    try {
        const expected = createHmac(algorithm, secret).update(payload).digest('hex');
        const actual = Buffer.from(signature, 'hex');
        const expectedBuf = Buffer.from(expected, 'hex');
        if (actual.length !== expectedBuf.length) return false;
        return timingSafeEqual(actual, expectedBuf);
    } catch {
        return false;
    }
}

export function generateHmacSignature(
    secret: string,
    payload: string,
    algorithm = 'sha512',
): string {
    return createHmac(algorithm, secret).update(payload).digest('hex');
}

export function generateNonce(length = 16): string {
    return Utils.generateRandomBytes(length);
}

export function generateTimestampMillis(): string {
    return Date.now().toString();
}

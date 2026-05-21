export type RetryWithBackoffOptions = {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    onRetry?: (attempt: number, error: unknown) => void;
};

/** Retries an async operation with exponential backoff until success or maxAttempts. */
export async function retryWithBackoff<T>(fn: () => Promise<T>, options: RetryWithBackoffOptions = {}): Promise<T> {
    const maxAttempts = options.maxAttempts ?? 10;
    let delayMs = options.initialDelayMs ?? 500;
    const maxDelayMs = options.maxDelayMs ?? 10_000;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (attempt >= maxAttempts) {
                break;
            }
            options.onRetry?.(attempt, error);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            delayMs = Math.min(delayMs * 2, maxDelayMs);
        }
    }

    throw lastError;
}

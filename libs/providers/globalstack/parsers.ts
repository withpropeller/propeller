// ──────────────────────────────────────────────────────────────
// Globalstack response unwrapper
// ──────────────────────────────────────────────────────────────
// Globalstack returns { type: "success"|"error", message, data/error_code }
// ──────────────────────────────────────────────────────────────

interface GlobalstackSuccess<T> {
  type: 'success';
  message: string;
  data: T;
}

interface GlobalstackError {
  type: 'error';
  message: string;
  error_code: string;
}

type GlobalstackResponse<T> = GlobalstackSuccess<T> | GlobalstackError;

/**
 * Unwrap a Globalstack response. Throws on error responses.
 */
export function unwrapGlobalstack<T>(res: GlobalstackResponse<T>): T {
  if (res.type === 'error') {
    throw new Error(`globalstack error [${res.error_code}]: ${res.message}`);
  }
  return res.data;
}

export type { GlobalstackResponse };

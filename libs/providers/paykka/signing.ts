// ──────────────────────────────────────────────────────────────
// PayKKa RSA Signing — signature generation & verification
// ──────────────────────────────────────────────────────────────
// Reference: https://open-cb-paykka.apifox.cn/main-en/8551684m0
// ──────────────────────────────────────────────────────────────

import { createSign, createVerify, type KeyObject } from 'node:crypto';

/**
 * Build the PayKKa canonical signature string.
 *
 *   5 lines, each ending \n except the last:
 *     <request_path>\n
 *     <timestamp_millis>\n
 *     <nonce>\n
 *     <merch_id>\n
 *     <request_body>
 *
 * Without request body → 4 lines (last line is merch_id, no trailing \n).
 */
export function buildCanonicalString(
  path: string,
  timestamp: string,
  nonce: string,
  merchId: string,
  body: string | null,
): string {
  const lines = [path, timestamp, nonce, merchId];
  if (body !== null) {
    lines.push(body);
  }
  return lines.join('\n');
}

/** Sign a canonical string with RSA SHA256. Returns base64-encoded signature. */
export function signRsaSha256(privateKey: KeyObject, canonicalString: string): string {
  const sign = createSign('SHA256');
  sign.update(canonicalString);
  sign.end();
  return sign.sign(privateKey, 'base64');
}

/** Verify an RSA SHA256 signature against a canonical string. */
export function verifyRsaSha256(publicKey: KeyObject, canonicalString: string, signature: string): boolean {
  const verify = createVerify('SHA256');
  verify.update(canonicalString);
  verify.end();
  return verify.verify(publicKey, signature, 'base64');
}

/**
 * Build the Authorization header value.
 *
 * PayKKa spec: URLEncode(JSON.stringify({
 *   sign_type, timestamp, nonce, key_id, signature
 * }))
 */
export function buildAuthorizationHeader(
  timestamp: string,
  nonce: string,
  keyId: string,
  signature: string,
): string {
  const authJson = JSON.stringify({
    sign_type: 'SHA256_WITH_RSA',
    timestamp,
    nonce,
    key_id: keyId,
    signature,
  });
  return encodeURIComponent(authJson);
}

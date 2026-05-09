import { describe, it, expect } from 'vitest';
import { DojahProvider } from './index.js';
import { createHmac } from 'node:crypto';

const config = {
  DOJAH_APP_ID: 'test-app-id',
  DOJAH_SECRET_KEY: 'test-secret',
  DOJAH_WEBHOOK_SECRET: 'whsec_dojah',
  DOJAH_BASE_URL: 'https://api.dojah.io',
};

describe('DojahProvider', () => {
  it('creates provider with valid config', () => {
    const provider = new DojahProvider({ config });
    expect(provider.name).toBe('dojah');
  });

  it('throws without APP_ID', () => {
    expect(() => new DojahProvider({ config: { ...config, DOJAH_APP_ID: '' } })).toThrow(
      'DOJAH_APP_ID not set',
    );
  });

  describe('webhook verification', () => {
    it('verifies valid HMAC SHA256 signature', () => {
      const provider = new DojahProvider({ config });
      const payload = JSON.stringify({ reference_id: 'ref_1', status: 'approved' });
      const sig = createHmac('sha256', 'whsec_dojah').update(payload).digest('hex');

      expect(provider.verifyWebhookSignature(payload, sig)).toBe(true);
    });

    it('rejects invalid signature', () => {
      const provider = new DojahProvider({ config });
      expect(provider.verifyWebhookSignature('{"test":1}', 'bad_sig')).toBe(false);
    });
  });
});

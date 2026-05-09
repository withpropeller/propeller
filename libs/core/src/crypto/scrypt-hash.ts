import { randomBytes, scrypt as scryptCallback, type ScryptOptions, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

type ScryptFn = (
  password: string | Buffer | NodeJS.TypedArray | DataView,
  salt: string | Buffer | NodeJS.TypedArray | DataView,
  keylen: number,
  options?: ScryptOptions,
) => Promise<Buffer>;

const scrypt: ScryptFn = promisify(scryptCallback);

const SALT_LENGTH = 24;
const SCRYPT_KEY_LENGTH = 32;
const SCRYPT_OPT_COST = 2 ** 15;
const SCRYPT_OPT_BLOCK_SIZE = 8;
const SCRYPT_OPT_PARALLELIZE = 1;
const SCRYPT_OPT_MAXMEM = 256 * SCRYPT_OPT_COST * SCRYPT_OPT_BLOCK_SIZE;

export type HashOptions = ScryptOptions & {
  saltLen?: number;
  hashLen?: number;
};

export const DefaultOptions: Required<Pick<HashOptions, 'N' | 'r' | 'p' | 'maxmem' | 'saltLen' | 'hashLen'>> = {
  N: SCRYPT_OPT_COST,
  r: SCRYPT_OPT_BLOCK_SIZE,
  p: SCRYPT_OPT_PARALLELIZE,
  maxmem: SCRYPT_OPT_MAXMEM,
  saltLen: SALT_LENGTH,
  hashLen: SCRYPT_KEY_LENGTH,
};

export class SCryptHash {
  protected static _applyOptions(options?: HashOptions): Required<typeof DefaultOptions> {
    const result: Record<string, unknown> = { ...DefaultOptions };
    if (options) {
      for (const k in options) {
        if (k in DefaultOptions) {
          result[k] = (options as Record<string, unknown>)[k];
        }
      }
    }
    return result as Required<typeof DefaultOptions>;
  }

  protected static async _hash(
    password: string | Buffer | NodeJS.TypedArray | DataView,
    salt: string | Buffer | NodeJS.TypedArray | DataView,
    options: Required<typeof DefaultOptions>,
  ): Promise<Buffer> {
    return scrypt(password, salt, options.hashLen, options);
  }

  /**
   * Returns base64-encoded `salt.hash`.
   */
  static async hash(password: string, options?: HashOptions): Promise<string> {
    const opts = SCryptHash._applyOptions(options);
    const salt = randomBytes(opts.saltLen);
    const hash = await SCryptHash._hash(password, salt, opts);
    return [salt.toString('base64'), hash.toString('base64')].join('.');
  }

  /**
   * Verifies password against a `salt.hash` from `hash()`.
   */
  static async verify(checkPassword: string, saltWithHash: string, options?: HashOptions): Promise<boolean> {
    try {
      const opts = SCryptHash._applyOptions(options);
      const [b64salt, b64hash] = saltWithHash.split('.');
      if (!b64salt || !b64hash) return false;
      const salt = Buffer.from(b64salt, 'base64');
      const hash = Buffer.from(b64hash, 'base64');
      const checkHash = await SCryptHash._hash(checkPassword, salt, opts);
      return timingSafeEqual(checkHash, hash);
    } catch {
      return false;
    }
  }
}

import { type BinaryToTextEncoding, createHmac } from 'node:crypto';

export class HmacHash {
  /**
   * Base64-encoded HMAC.
   *
   *   await HmacHash.hash('YourKey', 'AmazingSecret')
   */
  static async hash(
    key: string,
    secret: string,
    algorithm = 'sha512',
    encoding: BinaryToTextEncoding = 'base64',
  ): Promise<string> {
    return createHmac(algorithm, key).update(secret).digest(encoding);
  }

  static async hashHex(key: string, secret: string, algorithm = 'sha512'): Promise<string> {
    return createHmac(algorithm, key).update(secret).digest('hex');
  }
}

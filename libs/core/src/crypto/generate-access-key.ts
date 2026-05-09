import { customAlphabet } from 'nanoid';
import { AESEncryption } from './aes-gcm-encryption.js';
import { HmacHash } from './hmac-hash.js';

const MODEL_PREFIX_SEPARATOR = '.';

export class AccessKeyUtils {
  static async getKeyHashFromPlain(plainKey: string): Promise<string> {
    const parts = plainKey.split('.');
    const secretPart = parts.pop();
    if (!secretPart) {
      throw new Error('Invalid plain key: missing secret');
    }
    const key = parts.join('.');
    const hash = await HmacHash.hash(key, secretPart);
    return `${key}.${hash}`;
  }

  static getAccessKeyTag(key: string): string {
    const prefix = key.slice(0, key.lastIndexOf('.'));
    return prefix.slice(0, prefix.lastIndexOf('.'));
  }

  /**
   * Generates a new signing key plus its encrypted form.
   * Returns [plainKey, encrypted].
   */
  static generateSigningKey(tag: string, passphrase: string): [string, Buffer] {
    const alphabet = '$-_@0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const keyLength = 80 - (tag.length + 1);
    const key = customAlphabet(alphabet, keyLength)();
    const plainKey = `${tag}${MODEL_PREFIX_SEPARATOR}${key}`;
    const encrypted = AESEncryption.encryptPassphrase(plainKey, passphrase);
    return [plainKey, encrypted];
  }
}

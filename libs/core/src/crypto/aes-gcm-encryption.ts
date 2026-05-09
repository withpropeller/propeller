import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from 'node:crypto';

const SALT_LENGTH = 64;
const AES_KEY_LENGTH = 32;
const IV_LENGTH = 16;
const PBKDF2_ITERATIONS = 2145;

export class AESEncryption {
  /**
   * Encrypts text by given passphrase using AES-256-GCM.
   * Output layout: salt | iv | ciphertext | auth_tag
   */
  static encryptPassphrase(text: string, passphrase: string): Buffer {
    const iv = randomBytes(IV_LENGTH);
    const salt = randomBytes(SALT_LENGTH);
    const key = pbkdf2Sync(passphrase, salt, PBKDF2_ITERATIONS, 32, 'sha512');
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([salt, iv, encrypted, tag]);
  }

  static decryptPassphrase(byte: Buffer, passphrase: string): string {
    const salt = byte.subarray(0, SALT_LENGTH);
    const iv = byte.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const text = byte.subarray(SALT_LENGTH + IV_LENGTH, byte.length - IV_LENGTH);
    const tag = byte.subarray(byte.length - IV_LENGTH);
    const key = pbkdf2Sync(passphrase, salt, PBKDF2_ITERATIONS, 32, 'sha512');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted =
      decipher.update(text as unknown as string, 'binary' as BufferEncoding, 'utf8') + decipher.final('utf8');
    return decrypted;
  }

  static encrypt(plaintext: string, key: Buffer, iv: Buffer, algorithm = 'aes-256-cbc'): Buffer {
    const cipher = createCipheriv(algorithm, key, iv);
    const start = cipher.update(plaintext, 'utf8', 'hex');
    const end = cipher.final('hex');
    return Buffer.from(start + end, 'hex');
  }

  static decrypt(ciphertext: Buffer, key: Buffer, iv: Buffer, algorithm = 'aes-256-cbc'): string {
    const decipher = createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  }

  static getKeyIVPair(): [Buffer, Buffer] {
    const key = randomBytes(AES_KEY_LENGTH);
    const iv = randomBytes(IV_LENGTH);
    return [key, iv];
  }

  static getEncodedKeyIVPair(): [string, string] {
    const [key, iv] = AESEncryption.getKeyIVPair();
    return [Buffer.from(key).toString('base64'), Buffer.from(iv).toString('base64')];
  }
}

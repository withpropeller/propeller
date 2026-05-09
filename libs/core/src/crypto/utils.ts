import bs58 from 'bs58';
import { Types } from 'mongoose';

export class CryptoUtils {
  static base64EncodeUrlSafe(str: string): string {
    return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  static base64DecodeUrlSafe(str: string): string {
    const token = str.replace(/-/g, '+').replace(/_/g, '/').replace(/=/g, '');
    return Buffer.from(token, 'base64').toString('ascii');
  }

  static base58EncodeObjectId(str: string | Types.ObjectId): string {
    const hex = str instanceof Types.ObjectId ? str.toHexString() : str;
    const buf = Buffer.from(hex, 'hex');
    return bs58.encode(buf);
  }

  static base58DecodeObjectId(encoded: string): Types.ObjectId | null {
    try {
      const decoded = bs58.decode(encoded);
      const hex = Buffer.from(decoded).toString('hex');
      return new Types.ObjectId(hex);
    } catch {
      return null;
    }
  }

  static base64Encode(str: string): string {
    return Buffer.from(str).toString('base64');
  }
}

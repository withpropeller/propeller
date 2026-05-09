import * as Base58 from 'bs58';
import { Types } from 'mongoose';

export class CryptoUtils {
    static base64EncodeUrlSafe(str: string): string {
        str = Buffer.from(str).toString('base64');
        return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    static base64DecodeUrlSafe(str: string): string {
        const token = str.replace(/-/g, '+').replace(/_/g, '/').replace(/=/g, '');
        return Buffer.from(token, 'base64').toString('ascii');
    }

    static base58EncodeObjectId(str: string | Types.ObjectId): string {
        if (str instanceof Types.ObjectId) {
            str = str.toHexString();
        }
        const buf = Buffer.from(str, 'hex');
        return Base58.encode(buf);
    }

    static base58DecodeObjectId(encoded: string): Types.ObjectId {
        try {
            const decoded = Base58.decode(encoded);
            const hex = Buffer.from(decoded).toString('hex');
            return new Types.ObjectId(hex);
        } catch (e) {
            return null;
        }
    }

    static base64Encode(str: string): string {
        return Buffer.from(str).toString('base64');
    }
}

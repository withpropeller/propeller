import * as Base58 from 'bs58';

export class CryptoUtils {
    
    static base64EncodeUrlSafe(str: string): string {
        str = Buffer.from(str).toString('base64');
        return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    static base64DecodeUrlSafe(str: string): string {
        const token = str.replace(/-/g, '+').replace(/_/g, '/').replace(/=/g, '');
        return Buffer.from(token, 'base64').toString('ascii');
    }

    static base58EncodeObjectId(str: string): string {
        var buf = Buffer.from(str, 'hex');
        return Base58.encode(buf);
    }

    static base58DecodeObjectId(encoded: string): string {
        var decoded = Base58.decode(encoded); 
        return Buffer.from(decoded).toString('hex');
    }

}

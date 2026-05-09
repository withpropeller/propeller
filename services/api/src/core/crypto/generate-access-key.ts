import { customAlphabet } from 'nanoid';
import { AESEncryption } from './aes-gcm-encryption';
import { HmacHash } from './hmac-hash';
import { MODEL_PREFIX_SEPARATOR } from '@core/mongo';

export class AccessKeyUtils {
    static async getKeyHashFromPlain(plainKey: string) {
        const plainKeySplit = plainKey.split('.');

        const secret = plainKeySplit.splice(-1);
        const key = plainKeySplit.join('.');
        const hash = await HmacHash.hash(key, secret[0]);
        return key + '.' + hash;
    }

    static getAccessKeyTag(key: string) {
        const prefix = key.slice(0, key.lastIndexOf('.'));
        const tag = prefix.slice(0, prefix.lastIndexOf('.'));
        return tag;
    }

    static generateSigningKey(tag: string, passphrase: string): [string, Buffer] {
        const alphabet = '$-_@0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

        const keyLength = 80 - (tag.length + 1);
        const key = customAlphabet(alphabet, keyLength)();
        const plainKey = `${tag}${MODEL_PREFIX_SEPARATOR}${key}`;

        const encrypted = AESEncryption.encryptPassphrase(plainKey, passphrase);
        return [plainKey, encrypted];
    }
}

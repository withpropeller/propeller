import { MODEL_PREFIX_SEPARATOR } from '@core/helpers/constants';
import { customAlphabet } from 'nanoid';
import { HmacHash } from './hmac-hash';

export class AccessKeyUtils {
    static async generateAccessKey(tag: string): Promise<string[]> {
        const prefixAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        const keyAlphabet = '$-_@0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

        const prefixRandomLength = 8;
        const prefixRandom = customAlphabet(prefixAlphabet, prefixRandomLength)();
        const prefix = `${tag}${MODEL_PREFIX_SEPARATOR}${prefixRandom}`;
        const key = customAlphabet(keyAlphabet, 64)();

        const plainKey = prefix + '.' + key;
        const hash = await HmacHash.hash(prefix, key);
        const hashedKey = prefix + '.' + hash;

        return [plainKey, hashedKey];
    }

    static async validateAccessKey(plainKey: string, testHashKey: string) {
        const hashedKey = await this.getKeyHashFromPlain(plainKey);
        return hashedKey === testHashKey;
    }

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
}

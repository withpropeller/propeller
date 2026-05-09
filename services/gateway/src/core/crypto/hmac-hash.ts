import { createHmac, BinaryToTextEncoding } from 'crypto';

export class HmacHash {
    /**
     * Key Derivation Function
     *
     * Usage:
     *   await HmacHash.hash('YourKey', 'AmazingSecret');
     *
     * Example output:
     *   '5Uvh9yKdstm8zaVH1lGBd/ok7N96DT3Y+XGeeVmTxDXs2degUJMBZWKib2gTrNewpcJvUjU='
     *
     * @param key
     * @param secret
     * @param secret?
     * @return hex-encoded hash
     */
    static async hash(
        key: string,
        secret: string,
        algorithm = 'sha512',
        endcoding: BinaryToTextEncoding = 'base64',
    ): Promise<string> {
        return createHmac(algorithm, key).update(secret).digest(endcoding);
    }
}

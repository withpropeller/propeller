import { createHash, BinaryToTextEncoding } from 'crypto';

export class BasicHash {
    /**
     * Key Derivation Function
     *
     * Usage:
     *   await BasicHash.hash('AmazingSecret');
     *
     * Example output:
     *   '0800dcdb8a1e0281a75661a605313e4705c91f34'
     *

     * @param secret
     * @param algorithm?
     * @return hex-encoded hash
     */
    static hash(secret: string, algorithm = 'sha1', endcoding: BinaryToTextEncoding = 'hex'): string {
        return createHash(algorithm).update(secret).digest(endcoding);
    }

    static hashObject(
        obj: Record<string, unknown>,
        encoding: BinaryToTextEncoding = 'hex',
        algorithm = 'sha256',
    ): string {
        const sortedObjKeys = Object.keys(obj)
            .sort()
            .reduce((result, key) => {
                result[key] = obj[key];
                return result;
            }, {});

        const str = JSON.stringify(sortedObjKeys);
        return BasicHash.hash(str, algorithm, encoding);
    }
}

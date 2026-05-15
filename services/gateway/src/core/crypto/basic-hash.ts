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

    /** Hash an object using canonical JSON serialization (sorted keys). */
    static hashObject(obj: unknown, encoding: BinaryToTextEncoding = 'hex', algorithm = 'sha256'): string {
        return BasicHash.hash(BasicHash.canonicalize(obj), algorithm, encoding);
    }

    private static canonicalize(value: unknown): string {
        if (value === null || typeof value !== 'object') {
            return JSON.stringify(value);
        }
        if (Array.isArray(value)) {
            return '[' + value.map((v) => BasicHash.canonicalize(v)).join(',') + ']';
        }
        const keys = Object.keys(value as Record<string, unknown>).sort();
        const pairs = keys.map((k) => JSON.stringify(k) + ':' + BasicHash.canonicalize((value as Record<string, unknown>)[k]));
        return '{' + pairs.join(',') + '}';
    }
}

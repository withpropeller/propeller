import { type BinaryToTextEncoding, createHash } from 'node:crypto';

export class BasicHash {
  /**
   * Hex-encoded hash of a secret.
   *
   *   BasicHash.hash('AmazingSecret')
   *   // → '0800dcdb8a1e0281a75661a605313e4705c91f34'
   */
  static hash(secret: string, algorithm = 'sha1', encoding: BinaryToTextEncoding = 'hex'): string {
    return createHash(algorithm).update(secret).digest(encoding);
  }

  static hashObject(
    obj: Record<string, unknown>,
    encoding: BinaryToTextEncoding = 'hex',
    algorithm = 'sha256',
  ): string {
    const sorted = Object.keys(obj)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = obj[key];
        return result;
      }, {});
    return BasicHash.hash(JSON.stringify(sorted), algorithm, encoding);
  }
}

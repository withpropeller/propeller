import { from, type Observable } from 'rxjs';
import type { ICrypto } from './crypto.interface.js';
import { SCryptHash } from './scrypt-hash.js';

export class SCryptCrypto implements ICrypto {
  rxHash(password: string): Observable<string> {
    return from(this.hash(password));
  }

  rxCompare(password: string, hash: string): Observable<boolean> {
    return from(this.compare(password, hash));
  }

  async hash(password: string): Promise<string> {
    return SCryptHash.hash(password);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return SCryptHash.verify(password, hash);
  }
}

export const SCryptCryptoFactory = new SCryptCrypto();

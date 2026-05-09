import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from 'crypto';

const SALT_LENGTH = 64;
const AES_KEY_LENGTH = 32;
const IV_LENGTH = 16;
const PBKDF2_ITERATIONS = 2145;

/*
create passphrase
var initializationVector = randomBytes(64);
// console.log(initializationVector.toString('base64url'));
*/

export class AESEncryption {
    /**
     * Encrypts text by given key
     * @param String text to encrypt
     * @param Buffer masterkey
     * @returns String encrypted text, base64 encoded
     */
    static encryptPassphrase(text: string, passphrase: string) {
        // random initialization vector
        const iv = randomBytes(IV_LENGTH);

        // random salt
        const salt = randomBytes(SALT_LENGTH);

        // derive encryption key: 32 byte key length
        // in assumption the masterkey is a cryptographic and NOT a password there is no need for
        // a large number of iterations. It may can replaced by HKDF
        // the value of 2145 is randomly chosen!
        const key = pbkdf2Sync(passphrase, salt, PBKDF2_ITERATIONS, 32, 'sha512');

        // AES 256 GCM Mode
        const cipher = createCipheriv('aes-256-gcm', key, iv);

        // encrypt the given text
        const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

        // extract the auth tag
        const tag = cipher.getAuthTag();

        // generate output
        // return Buffer.concat([salt, iv, encrypted, tag]).toString('base64');
        return Buffer.concat([salt, iv, encrypted, tag]);
    }

    /**
     *
     * Decrypts text by given key
     * @param String base64 encoded input data
     * @param Buffer passphrase
     * @returns String decrypted (original) text
     */
    static decryptPassphrase(byte: Buffer, passphrase: string) {
        // base64 decoding
        //const byte = Buffer.from(encrypted, 'base64');

        // convert data to buffers
        const salt = byte.slice(0, SALT_LENGTH);
        const iv = byte.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const text = byte.slice(SALT_LENGTH + IV_LENGTH, byte.length - IV_LENGTH);
        const tag = byte.slice(byte.length - IV_LENGTH);

        // derive key using; 32 byte key length
        const key = pbkdf2Sync(passphrase, salt, PBKDF2_ITERATIONS, 32, 'sha512');

        // AES 256 GCM Mode
        const decipher = createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);

        // encrypt the given text
        const decrypted = decipher.update(text, 'binary' as any, 'utf8') + decipher.final('utf8');

        return decrypted;
    }

    /**
     * Encrypts text by given key
     * @param String text to encrypt
     * @param Buffer masterkey
     * @returns String encrypted text, base64 encoded
     */
    static encrypt(plaintext: string, key: Buffer, iv: Buffer, algorithm = 'aes-256-cbc'): Buffer {
        const cipher = createCipheriv(algorithm, key, iv);
        const start = cipher.update(plaintext, 'utf8', 'hex');
        const end = cipher.final('hex');
        return Buffer.from(start + end, 'hex');
    }

    /**
     * Decrypts text by given key
     * @param Buffer encrypted text
     * @param Buffer masterkey
     * @returns String decrypted text
     */
    static decrypt(ciphertext: Buffer, key: Buffer, iv: Buffer, algorithm = 'aes-256-cbc'): string {
        const decipher = createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(ciphertext);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString('utf8');
    }

    static getKeyIVPair(): [Buffer, Buffer] {
        const key = randomBytes(AES_KEY_LENGTH);
        const iv = randomBytes(IV_LENGTH);
        return [key, iv];
    }

    static getEncodedKeyIVPair(): [string, string] {
        const [key, iv] = AESEncryption.getKeyIVPair();
        const encodedKey = Buffer.from(key).toString('base64');
        const encodedIV = Buffer.from(iv).toString('base64');
        return [encodedKey, encodedIV];
    }
}

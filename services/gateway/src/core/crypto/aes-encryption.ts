import { InternalServerErrorException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const IV_LENGTH = 16; // For AES, this is always 16

export class AESEncryption {
    static encrypt(text: string, encryptionKey: string) {
        try {
            const iv = randomBytes(IV_LENGTH);
            const cipher = createCipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex'), iv);

            let encrypted = cipher.update(text);
            encrypted = Buffer.concat([encrypted, cipher.final()]);

            const ivAndSecret = iv.toString('hex') + ':' + encrypted.toString('hex');

            return Buffer.from(ivAndSecret).toString('base64');
        } catch (e) {
            throw new InternalServerErrorException();
        }
    }

    static decrypt(text: string, encryptionKey: string) {
        try {
            const str = Buffer.from(text, 'base64').toString('ascii');

            const textParts = str.split(':');
            const iv = Buffer.from(textParts.shift(), 'hex');
            const encryptedText = Buffer.from(textParts.join(':'), 'hex');
            const decipher = createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex'), iv);
            let decrypted = decipher.update(encryptedText);

            decrypted = Buffer.concat([decrypted, decipher.final()]);

            return decrypted.toString();
        } catch (e) {
            throw new InternalServerErrorException();
        }
    }
}

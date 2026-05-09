import { RSA_PKCS1_OAEP_PADDING } from 'constants';
import { KeyObject, createPrivateKey, createPublicKey, privateDecrypt, publicEncrypt } from 'crypto';
import * as fs from 'fs';

export class RSAPair {
    private key: KeyObject;
    private pubKey: KeyObject;

    constructor(keyStr: string, keyPubStr: string) {
        this.key = this.getPrivateKeyFromFile(keyStr);
        this.pubKey = this.getPublicKeyFromFile(keyPubStr);
    }

    private getPrivateKeyFromFile(privateKeyPath: string): KeyObject {
        const keyData = fs.readFileSync(privateKeyPath, 'utf8');
        return createPrivateKey({
            key: keyData,
            format: 'pem',
            type: 'pkcs8',
        });
    }

    private getPublicKeyFromFile(filePath: string): KeyObject {
        const keyData = fs.readFileSync(filePath);
        return createPublicKey({
            key: keyData,
            format: 'pem',
            type: 'pkcs1',
        });
    }

    private getIdRsaFromStr(keyStr: string): KeyObject {
        // base64 decode the string to get the binary data
        const keyData = Buffer.from(keyStr, 'base64');

        return createPrivateKey({
            key: keyData,
            format: 'der',
            type: 'pkcs1',
        });
    }

    private getIdRsaPubFromStr(keyPubStr: string): KeyObject {
        // base64 decode the string to get the binary data
        const keyData = Buffer.from(keyPubStr, 'base64');

        return createPublicKey({
            key: keyData,
            format: 'der',
            type: 'spki',
        });
    }

    public encrypt(data: string): Buffer {
        const buf = Buffer.from(data, 'utf8');
        return publicEncrypt(this.pubKey, buf);
    }

    public decrypt(data: string): string {
        const buf = Buffer.from(data, 'base64');
        const decrypted = privateDecrypt(this.key, buf);

        return decrypted.toString('utf8');
    }
}

export class RSAEncryption {
    private pubKey: KeyObject;

    constructor(keyPubStr: string) {
        this.pubKey = this.getPublicKeyFromFile(keyPubStr);
    }

    private getPublicKeyFromFile(filePath: string): KeyObject {
        const keyData = fs.readFileSync(filePath);
        return createPublicKey({
            key: keyData,
            format: 'pem',
            type: 'pkcs1',
        });
    }

    public encrypt(data: string): Buffer {
        const buf = Buffer.from(data, 'utf8');
        return publicEncrypt(this.pubKey, buf);
    }

    public encryptOAEP(data: string): Buffer {
        const buf = Buffer.from(data, 'utf8');
        return publicEncrypt(
            {
                key: this.pubKey,
                padding: RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            },
            buf,
        );
    }
}

export class RSADecryption {
    private key: KeyObject;

    constructor(keyStr: string) {
        this.key = this.getPrivateKeyFromFile(keyStr);
    }

    private getPrivateKeyFromFile(privateKeyPath: string): KeyObject {
        const keyData = fs.readFileSync(privateKeyPath, 'utf8');
        return createPrivateKey({
            key: keyData,
            format: 'pem',
            type: 'pkcs8',
        });
    }

    public decryptOAEP(data: string): string {
        const buf = Buffer.from(data, 'base64');
        const decrypted = privateDecrypt(
            {
                key: this.key,
                padding: RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            },
            buf,
        );

        return decrypted.toString('utf8');
    }
}

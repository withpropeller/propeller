import {
  constants,
  createPrivateKey,
  createPublicKey,
  type KeyObject,
  privateDecrypt,
  publicEncrypt,
} from 'node:crypto';
import * as fs from 'node:fs';

export class RSAPair {
  private key: KeyObject;
  private pubKey: KeyObject;

  constructor(privateKeyPath: string, publicKeyPath: string) {
    this.key = this.getPrivateKeyFromFile(privateKeyPath);
    this.pubKey = this.getPublicKeyFromFile(publicKeyPath);
  }

  private getPrivateKeyFromFile(privateKeyPath: string): KeyObject {
    const keyData = fs.readFileSync(privateKeyPath, 'utf8');
    return createPrivateKey({ key: keyData, format: 'pem', type: 'pkcs8' });
  }

  private getPublicKeyFromFile(filePath: string): KeyObject {
    const keyData = fs.readFileSync(filePath);
    return createPublicKey({ key: keyData, format: 'pem', type: 'pkcs1' });
  }

  public encrypt(data: string): Buffer {
    return publicEncrypt(this.pubKey, Buffer.from(data, 'utf8'));
  }

  public decrypt(data: string): string {
    const buf = Buffer.from(data, 'base64');
    return privateDecrypt(this.key, buf).toString('utf8');
  }
}

export class RSAEncryption {
  private pubKey: KeyObject;

  constructor(publicKeyPath: string) {
    const keyData = fs.readFileSync(publicKeyPath);
    this.pubKey = createPublicKey({ key: keyData, format: 'pem', type: 'pkcs1' });
  }

  public encrypt(data: string): Buffer {
    return publicEncrypt(this.pubKey, Buffer.from(data, 'utf8'));
  }
}

export class RSADecryption {
  private key: KeyObject;

  constructor(privateKeyPath: string) {
    const keyData = fs.readFileSync(privateKeyPath, 'utf8');
    this.key = createPrivateKey({ key: keyData, format: 'pem', type: 'pkcs8' });
  }

  public decrypt(data: string): string {
    const buf = Buffer.from(data, 'base64');
    const decrypted = privateDecrypt(
      {
        key: this.key,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buf,
    );
    return decrypted.toString('utf8');
  }
}

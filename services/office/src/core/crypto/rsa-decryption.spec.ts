import { RSADecryption } from './rsa-encryption';
import * as fs from 'fs';
import { RSA_PKCS1_OAEP_PADDING } from 'constants';
import * as crypto from 'crypto';

// Mock fs module
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

// Mock Buffer.from for the invalid base64 test
const originalBufferFrom = Buffer.from;
Buffer.from = function (data: string, encoding?: string): Buffer {
    if (encoding === 'base64' && data === '!@#$%^&*()') {
        throw new Error('Invalid base64 input');
    }
    return originalBufferFrom.call(this, data, encoding);
} as any;

// Mock crypto module
jest.mock('crypto', () => {
    const originalModule = jest.requireActual('crypto');

    // Create a mock private key object
    const mockPrivateKey = {
        asymmetricKeyType: 'rsa',
        type: 'private',
    };

    return {
        ...originalModule,
        createPrivateKey: jest.fn(() => mockPrivateKey),
        privateDecrypt: jest.fn(() => {
            // For testing purposes, we're just returning a known value
            // In a real scenario, this would actually decrypt the data
            return Buffer.from('decrypted data', 'utf8');
        }),
    };
});

// Mock the RSA_PKCS1_OAEP_PADDING constant
jest.mock('constants', () => ({
    RSA_PKCS1_OAEP_PADDING: 4, // Just a mock value
}));

describe('RSADecryption', () => {
    // Setup
    const privateKeyPath = '/path/to/private_key.pem';
    const privateKeyContent = '-----BEGIN PRIVATE KEY-----\nMockPrivateKeyContent\n-----END PRIVATE KEY-----';
    const encryptedData = 'base64EncodedEncryptedData';

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Setup default mock for readFileSync
        mockedFs.readFileSync.mockReturnValue(privateKeyContent);
    });

    afterAll(() => {
        // Restore original Buffer.from
        Buffer.from = originalBufferFrom as any;
    });

    describe('constructor', () => {
        it('should initialize with a private key file path', () => {
            // Act
            const rsaDecryption = new RSADecryption(privateKeyPath);

            console.log(rsaDecryption);

            // Assert
            expect(mockedFs.readFileSync).toHaveBeenCalledWith(privateKeyPath, 'utf8');
            expect(rsaDecryption).toBeDefined();
        });

        it('should throw an error if the private key file cannot be read', () => {
            // Arrange
            mockedFs.readFileSync.mockImplementation(() => {
                throw new Error('File not found');
            });

            // Act & Assert
            expect(() => new RSADecryption(privateKeyPath)).toThrow();
        });
    });

    describe('decrypt', () => {
        it('should decrypt data correctly', () => {
            // Arrange
            const rsaDecryption = new RSADecryption(privateKeyPath);

            // Act
            const decryptedData = rsaDecryption.decryptOAEP(encryptedData);

            // Assert
            expect(decryptedData).toBe('decrypted data');
        });

        it('should handle base64 input correctly', () => {
            // Arrange
            const rsaDecryption = new RSADecryption(privateKeyPath);
            const base64EncodedData = Buffer.from('test').toString('base64');

            // Act
            rsaDecryption.decryptOAEP(base64EncodedData);

            // Assert - check that privateDecrypt was called
            expect(crypto.privateDecrypt).toHaveBeenCalled();
        });

        it('should throw an error if input is not valid base64', () => {
            // This test is more complex because we need to simulate the Buffer.from
            // throwing an error when given invalid base64

            // Arrange
            const rsaDecryption = new RSADecryption(privateKeyPath);
            const invalidBase64 = '!@#$%^&*()'; // Invalid base64 characters

            // Act & Assert
            expect(() => rsaDecryption.decryptOAEP(invalidBase64)).toThrow();
        });

        it('should throw an error if decryption fails', () => {
            // Arrange
            const rsaDecryption = new RSADecryption(privateKeyPath);

            // Override the mock for just this test
            (crypto.privateDecrypt as jest.Mock).mockImplementationOnce(() => {
                throw new Error('Decryption failed');
            });

            // Act & Assert
            expect(() => rsaDecryption.decryptOAEP(encryptedData)).toThrow('Decryption failed');

            // No need to restore manually as jest.mockImplementationOnce only affects one call
        });
    });

    describe('OAEP padding configuration', () => {
        it('should use PKCS1 OAEP padding with SHA-256', () => {
            // Arrange
            const rsaDecryption = new RSADecryption(privateKeyPath);

            // Act
            rsaDecryption.decryptOAEP(encryptedData);

            // Assert
            expect(crypto.privateDecrypt).toHaveBeenCalledWith(
                expect.objectContaining({
                    key: expect.anything(),
                    padding: RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256',
                }),
                expect.anything(),
            );
        });
    });
});

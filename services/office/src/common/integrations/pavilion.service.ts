import { ConfigService } from '@config/config.service';
import { HttpService } from '@nestjs/axios';
import * as retry from 'async-retry';
import { firstValueFrom } from 'rxjs';
import { AppException } from '@core/exceptions';
import { TenantRequestPayload } from '@core/helpers/tenant-context-id.strategy';
import { RSADecryption, RSAEncryption } from '@core/crypto/rsa-encryption';
import { AESEncryption } from '@core/crypto/aes-gcm-encryption';
import { BasicHash } from '@core/crypto/basic-hash';
import { RestUriCredentials } from '@config/uri-credential';
import { ExecutionOptions } from '@common/interfaces';
import { IntegrationException } from './integration.exception';
import { PavilionCard } from './integrations.interfaces';
import { HydratedDocument } from 'mongoose';
import { CardProgram } from '@api/card-program/card-program.schema';
import { Utils } from '@core/helpers';

export interface PavilionAuth {
    headers: Record<string, string>;
    key: Buffer;
    iv: Buffer;
    encodedKey: string;
    encodedIV: string;
}

export class PavilionService {
    private encryption: RSAEncryption;
    private decryption: RSADecryption;
    private pavilionCredentials: RestUriCredentials;

    constructor(protected request: TenantRequestPayload, private readonly http: HttpService) {
        this.encryption = new RSAEncryption(`/etc/secrets/${this.request.tenantId}-pavilion-public.pem`);
        this.decryption = new RSADecryption(`/etc/secrets/${this.request.tenantId}-private.pem`);
    }

    static new(
        request: TenantRequestPayload,
        config: ConfigService,
        http: HttpService,
        credentials?: RestUriCredentials,
    ): PavilionService {
        const service = new PavilionService(request, http);
        if (credentials) {
            credentials.id = service.decryption.decryptOAEP(credentials.id);
            credentials.secret = service.decryption.decryptOAEP(credentials.secret);
            service.pavilionCredentials = credentials;
            return service;
        }
        service.pavilionCredentials = config.PAVILION_URI(request);
        return service;
    }

    async getCardProfiles(): Promise<string[]> {
        return this.sendGetRequestAndDecrypt('/api/v1/Card/card-profile-names');
    }

    async getCardRequest(): Promise<any> {
        return this.sendGetRequestAndDecrypt('/api/v1/Card/requests');
    }

    async getCardsMaskedPansByBatchNumber(batchNumber: string): Promise<any> {
        return this.sendGetRequestAndDecrypt(`/api/v1/Card/batch/${batchNumber}`);
    }

    async getCardByAccountNumber(accountNumber: string): Promise<any> {
        return this.sendGetRequestAndDecrypt(`/api/v1/Card/account/${accountNumber}`);
    }

    async getCardsByBatchNumber(batchNumber: string): Promise<PavilionCard[]> {
        return retry(
            async () => {
                return await this.sendGetRequestAndDecrypt(`/api/v1/Card/batch/${batchNumber}/details`);
            },
            { retries: 3 },
        );
    }

    async requestVirtualCard(data: Record<string, any>): Promise<any> {
        return this.sendPostRequestAndDecrypt('/api/v1/Card/pool/new-virtual-request', data);
    }

    async getCardStatus(id: string): Promise<Record<string, any>[]> {
        return this.sendGetRequestAndDecrypt(`/api/v1/Card/card-status/${id}`);
    }

    async unlinkCard(id: string, options?: ExecutionOptions): Promise<any> {
        if (!options?.dryRun) {
            return retry(
                async () => {
                    return await this.sendPostRequestAndDecrypt('/api/v1/Card/card-unlinking', { id });
                },
                { retries: 3 },
            );
        }
    }

    async getBatchDetails(batchNumber: string): Promise<any> {
        return this.sendGetRequestAndDecrypt(`/api/v1/Card/batch/${batchNumber}/details`);
    }

    private async requestInstantCard(data: Record<string, any>, options?: ExecutionOptions): Promise<any> {
        if (options.dryRun) {
            return { BatchNumber: Utils.generateRandomID('19') };
        }
        return this.sendPostRequestAndDecrypt('/api/v1/Card/new-instant-request', data);
    }

    /**
     * Requests cards in batches based on the specified amount and card profile.
     * @param amount - The total amount of cards to request.
     * @returns A promise that resolves to an array of batch numbers for the requested cards.
     */
    async batchInstantCardRequest(program: HydratedDocument<CardProgram>, options?: ExecutionOptions): Promise<any> {
        let cycles = Math.floor(program.quantity / 1000);
        const batches = [];
        console.log('===5 personalise');
        do {
            let take: number;
            if (cycles > 0) {
                take = 1000;
            } else if (cycles === 0) {
                take = program.quantity % 1000;
            }

            if (take > 0) {
                const data = {
                    amount: take,
                    cardProfile: program.config.partnerProfile,
                    defaultNameOnCard: program.personalization.defaultCardholderName,
                };
                console.log('===6 personalise');
                const res = await this.requestInstantCard(data, options);
                if (res['BatchNumber']) {
                    batches.push(res['BatchNumber']);
                } else {
                    throw IntegrationException.PavilionError(null, res);
                }
            }

            cycles--;
        } while (cycles >= 0);

        console.log('===7 personalise');
        return batches;
    }

    private async sendGetRequestAndDecrypt<T = any>(endpoint: string): Promise<T> {
        const url = this.pavilionCredentials.baseUrl + endpoint;

        const auth = this.prepareAuth(this.pavilionCredentials);

        try {
            const res = await firstValueFrom(this.http.get(url, { headers: auth.headers }));
            const decrypted = this.decryptWithPavilionAuth(res.data, auth);
            return JSON.parse(decrypted.toString());
        } catch (e) {
            throw AppException.ServiceUnavailable.setError(e);
        }
    }

    private async sendPostRequestAndDecrypt<T = any>(endpoint: string, data?: Record<string, any>): Promise<T> {
        const uri = this.pavilionCredentials;
        const url = uri.baseUrl + endpoint;

        const auth = this.prepareAuth(uri);
        const encryptData = this.encryptWithPavilionAuth(auth, data);

        console.log('====');
        console.log('sending request to pavilion with url', url);
        console.log('request body', data);
        console.log('encrypted body', encryptData);
        try {
            const res = await firstValueFrom(this.http.post(url, encryptData, { headers: auth.headers }));
            const decrypted = this.decryptWithPavilionAuth(res.data, auth);
            return JSON.parse(decrypted.toString());
        } catch (e) {
            console.log('error response from pavilion', e.response?.data);
            console.log('====');
            if (e.response?.data?.responseCode === '90000') {
                return e.response.data;
            }
            throw AppException.ServiceUnavailable.setError(e);
        }
    }

    private prepareAuth(uri: RestUriCredentials): PavilionAuth {
        const [key, iv] = AESEncryption.getKeyIVPair();
        const encodedKey = Buffer.from(key).toString('base64');
        const encodedIV = Buffer.from(iv).toString('base64');

        const headers = this.prepareHeaders(uri, encodedKey, encodedIV);

        return {
            headers,
            key,
            iv,
            encodedKey,
            encodedIV,
        };
    }

    async prepareHeadersWithKeyAndIV(key: Buffer, iv: Buffer): Promise<Record<string, string>> {
        const uri = this.pavilionCredentials;
        const encodedKey = Buffer.from(key).toString('base64');
        const encodedIV = Buffer.from(iv).toString('base64');

        return this.prepareHeaders(uri, encodedKey, encodedIV);
    }

    private prepareHeaders(uri: RestUriCredentials, encodedKey: string, encodedIV: string) {
        const sessionKey = this.encryption.encrypt(encodedKey).toString('hex');
        return {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-AccessKey': BasicHash.hash(uri.secret, 'sha512'),
            'X-AccessId': uri.id,
            'X-SessionKey': sessionKey,
            'X-SessionIV': encodedIV,
        };
    }

    private encryptWithPavilionAuth(auth: PavilionAuth, data?: Record<string, any>): string {
        if (!data) {
            return '';
        }
        const encryptedData = AESEncryption.encrypt(JSON.stringify(data), auth.key, auth.iv);

        return encryptedData.toString('hex');
    }

    private decryptWithPavilionAuth(data: string, auth: PavilionAuth) {
        const encryptedData = Buffer.from(data, 'hex');
        const decryptedData = AESEncryption.decrypt(encryptedData, auth.key, auth.iv);

        return decryptedData;
    }

    private encryptData(data: string, key: Buffer, iv: Buffer) {
        const encryptedData = AESEncryption.encrypt(data, key, iv);

        return encryptedData.toString('hex');
    }

    private decryptData(data: string, key: Buffer, iv: Buffer) {
        const encryptedData = Buffer.from(data, 'hex');
        const decryptedData = AESEncryption.decrypt(encryptedData, key, iv);

        return decryptedData;
    }
}

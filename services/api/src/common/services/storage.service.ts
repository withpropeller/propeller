import { ConfigService } from '@config/config.service';
import { Injectable } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { AppException } from '@core/exceptions';
import { Utils } from '@core/helpers';
import { ReporterService } from './reporter.service';
import { HttpService } from '@nestjs/axios';
import { ExecutionOptions } from '@common/interfaces';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';

@Injectable()
export class StorageService {
    private client: S3Client;

    constructor(private readonly config: ConfigService, private reporter: ReporterService, private http: HttpService) {
        this.client = new S3Client({
            region: config.AWS_REGION,
            credentials: {
                secretAccessKey: config.S3_SECRET_ACCESS_KEY,
                accessKeyId: config.S3_ACCESS_KEY_ID,
            },
        });
    }

    async uploadViaUrl(prefix: string, url: string, options?: ExecutionOptions) {
        const body = await firstValueFrom(this.http.get(url, { responseType: 'arraybuffer' }));

        const originalName = url.split('/').pop();
        const extSplit = originalName.split('.');
        const ext = extSplit.pop();
        const fileName = extSplit.join('');
        const keyName = `${prefix}/${Utils.generateRandomID(10)}-${Utils.toSlug(fileName)}.${ext}`;

        return this.storeDocuments(keyName, body.data, options);
    }

    public async storeDocuments(documentKey: string, file: Buffer, options?: ExecutionOptions) {
        const command = new PutObjectCommand({
            Bucket: this.config.S3_DOCUMENT_STORE_BUCKET,
            Key: documentKey,
            Body: file,
            ACL: 'public-read',
        });

        try {
            if (!options?.dryRun) {
                await this.client.send(command);
            }
            const url = `https://${this.config.S3_DOCUMENT_STORE_BUCKET}.s3.${this.config.AWS_REGION}.amazonaws.com/${documentKey}`;

            return { url, keyName: documentKey };
        } catch (e) {
            this.reporter.pushError({
                context: StorageService.name,
                error: new AppException(e),
            });
        }
    }

    public async deleteDocument(documentKey: string, options?: ExecutionOptions) {
        const command = new DeleteObjectCommand({
            Bucket: this.config.S3_DOCUMENT_STORE_BUCKET,
            Key: documentKey,
        });

        try {
            if (!options?.dryRun) {
                await this.client.send(command);
            }
        } catch (e) {
            this.reporter.pushError({
                context: StorageService.name,
                error: new AppException(e),
            });
        }
    }
}

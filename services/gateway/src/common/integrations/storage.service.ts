import { ConfigService } from '@config/config.service';
import { Injectable } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { AppException } from '@core/exceptions';
import { Utils } from '@core/helpers';
import { ReporterService } from '@common/services/reporter.service';
import { firstValueFrom } from 'rxjs';
import { ExecutionOptions } from '@core/interfaces';
import { HttpService } from '@nestjs/axios';
import { addDays } from 'date-fns';

export interface S3ObjectExpire {
    expires: Date;
    tagging: string;
}

export const S3_EXPIRE_OBJECT_3_DAYS: S3ObjectExpire = {
    expires: addDays(new Date(), 3),
    tagging: 'hyphen-expire-after=3d',
};

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

    async getBufferFromURL(url: string) {
        try {
            const body = await firstValueFrom(this.http.get(url, { responseType: 'arraybuffer' }));
            return body.data;
        } catch (e) {
            return null;
        }
    }

    async uploadViaUrl(path: string, url: string, options?: ExecutionOptions) {
        try {
            const body = await firstValueFrom(this.http.get(url, { responseType: 'arraybuffer' }));
            const timestamp = new Date().getTime();
            const fileName = StorageService.getFileNameFromURL(url);
            const keyName = `${path}/${timestamp}-${fileName}`;

            return this.storeDocuments(keyName, body.data, undefined, options);
        } catch (e) {
            this.reporter.pushError({
                context: StorageService.name,
                error: new AppException(e),
            });

            throw new AppException(e);
        }
    }

    async uploadFile(path: string, file: Express.Multer.File, expires?: Date) {
        const timestamp = new Date().getTime();
        const fileName = StorageService.getFileNameFromURL(file.originalname);
        const keyName = `${path}/${timestamp}-${fileName}`;

        return this.storeDocuments(keyName, file.buffer, expires);
    }

    public async storeDocuments(documentKey: string, file: Buffer, expires?: Date, options?: ExecutionOptions) {
        const command = new PutObjectCommand({
            Bucket: this.config.S3_DOCUMENT_STORE_BUCKET,
            Key: documentKey,
            Body: file,
            ACL: 'public-read',
            Expires: expires,
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

    public async deleteDocument(documentKey: string) {
        const command = new DeleteObjectCommand({
            Bucket: this.config.S3_DOCUMENT_STORE_BUCKET,
            Key: documentKey,
        });

        try {
            await this.client.send(command);
        } catch (e) {
            this.reporter.pushError({
                context: StorageService.name,
                error: new AppException(e),
            });
        }
    }

    /**
     * FileNameFromURL extracts the file name from a URL
     *
     */
    public static getFileNameFromURL(url: string): string {
        let lastPart = url;
        if (url.lastIndexOf('/') !== -1) {
            lastPart = url.substring(url.lastIndexOf('/') + 1);
        }

        if (lastPart.indexOf('?') !== -1) {
            lastPart = lastPart.substring(0, lastPart.indexOf('?'));
        }

        if (lastPart.indexOf('-') !== -1) {
            lastPart = lastPart.substring(lastPart.indexOf('-') + 1);
        }

        const extSplit = lastPart.split('.');
        const ext = extSplit.pop();
        const kebabCase = Utils.toSlug(extSplit.join('.'));

        return `${kebabCase}.${ext}`;
    }
}

import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { TenantRequestPayload } from '@core/helpers';
import { InfraApiService } from '@common/api-service/infra-api.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@config/config.service';
import { StorageService } from '@common/integrations/storage.service';
import { addHours } from 'date-fns';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class ToolsService extends InfraApiService {
    constructor(
        @Inject(REQUEST) request: TenantRequestPayload,
        http: HttpService,
        config: ConfigService,
        private storageService: StorageService,
    ) {
        super(http, request, config, '/tools');
    }

    async uploadTempFile(file: Express.Multer.File) {
        const expires = addHours(new Date(), 3);
        return this.storageService.uploadFile(`temp`, file, expires);
    }

    async deleteUploadTempFile(key: string) {
        return this.storageService.deleteDocument(key);
    }
}

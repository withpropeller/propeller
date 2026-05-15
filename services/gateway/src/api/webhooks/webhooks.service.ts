import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { TenantRequestPayload } from '@core/helpers';
import { ConfigService } from '@config/config.service';
import { InfraApiService } from '@common/api-service/infra-api.service';
import { HttpService } from '@nestjs/axios';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class WebhookService extends InfraApiService {
    constructor(@Inject(REQUEST) request: TenantRequestPayload, http: HttpService, config: ConfigService) {
        super(http, request, config, '/webhooks');
    }
}

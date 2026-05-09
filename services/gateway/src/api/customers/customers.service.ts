import { InfraApiService } from '@common/api-service/infra-api.service';
import { ConfigService } from '@config/config.service';
import { TenantRequestPayload } from '@core/helpers';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class CustomersService extends InfraApiService {
    
    constructor(
        @Inject(REQUEST) request: TenantRequestPayload,
        http: HttpService,
        config: ConfigService,
    ) {
        super(http, request, config, '/customers')
    }

}
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { TenantRequestPayload } from '@core/helpers';
import { InfraApiService } from '@common/api-service/infra-api.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@config/config.service';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class PaymentService extends InfraApiService {
    
    constructor(
        @Inject(REQUEST) request: TenantRequestPayload,
        http: HttpService,
        config: ConfigService,
    ) {
        super(http, request, config, '/payments')
    }

}

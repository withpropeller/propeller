import { ConfigService } from '@config/config.service';
import { ReporterService } from '@core/services';
import { HttpService } from '@nestjs/axios';
import { PaystackService } from './paystack.service';

export enum IntegrationProviders {
    NIBSS_DIRECT_DEBIT = 'nibss-direct-debit',
}

export const NIBSS_DIRECT_DEBIT_INTEGRATION_PROVIDER = {
    provide: IntegrationProviders.NIBSS_DIRECT_DEBIT,
    useFactory: (config: ConfigService, httpService: HttpService) => {
        return new PaystackService(config, httpService);
    },
    inject: [ConfigService, HttpService, ReporterService],
};

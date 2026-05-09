import { ProvidusService } from '@common/integrations/providus.service';
import { ReporterService } from '@common/services/reporter.service';
import { ConfigService } from '@config/config.service';

import { HttpService } from '@nestjs/axios';

export function getVACIntegration(config: ConfigService, httpService: HttpService, reporter: ReporterService) {
    return new ProvidusService(config, httpService, reporter);
}

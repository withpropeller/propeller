import { ProvidusService } from '@common/integrations/providus.service';
import { ReporterService } from '@common/services/reporter.service';
import { ConfigService } from '@config/config.service';

import { HttpService } from '@nestjs/axios';
import { SettlementAccountPartner } from './settlement-account.enums';
import { PaystackService } from '@common/integrations/paystack.service';
import { ISettlementAccountIntegration } from '@common/integrations/integrations.interfaces';
import { MapleradService } from '@common/integrations/maplerad.service';

export function getVACIntegration(config: ConfigService, httpService: HttpService, reporter: ReporterService) {
    return new ProvidusService(config, httpService, reporter);
}

export function getSettlementAccountIntegration(
    partner: SettlementAccountPartner,
    config: ConfigService,
    httpService: HttpService,
    reporter: ReporterService,
): ISettlementAccountIntegration {
    switch (partner) {
        case SettlementAccountPartner.Providus:
            return new ProvidusService(config, httpService, reporter);
        case SettlementAccountPartner.Paystack:
            return new PaystackService(config, httpService, reporter);
        case SettlementAccountPartner.Maplerad:
            return new MapleradService(config, httpService, reporter);
        default:
            throw new Error(`Unsupported partner: ${partner}`);
    }
}

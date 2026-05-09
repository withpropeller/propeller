import { ConfigService } from '@config/config.service';
import { ReporterService } from '@core/services';
import { HttpService } from '@nestjs/axios';

// getVACIntegration was wired to ProvidusService (card-issuing provider).
// In MOR we only use Paystack for virtual accounts.
export function getVACIntegration(_config: ConfigService, _httpService: HttpService, _reporter: ReporterService) {
    // TODO: Wire to Paystack PWT when virtual account creation is needed (Wave 3)
    return null;
}

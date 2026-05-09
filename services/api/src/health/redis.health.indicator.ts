import { FloService } from '@core/services/flo.service';
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';

@Injectable()
export class FloHealthIndicator extends HealthIndicator {
    constructor(private flo: FloService) {
        super();
    }

    async isHealthy(key: string): Promise<HealthIndicatorResult> {
        const isHealthy = this.flo.isOpen();
        const result = this.getStatus(key, isHealthy);

        if (isHealthy) {
            return result;
        }
        throw new HealthCheckError('Flo health check failed', result);
    }
}

// keep old name as alias so existing imports continue to resolve
export { FloHealthIndicator as RedisHealthIndicator };

import { RedisService } from '@core/services/redis.service';
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
    constructor(private redisService: RedisService) {
        super();
    }

    async isHealthy(key: string): Promise<HealthIndicatorResult> {
        const isHealthy = this.redisService.isOpen();
        const result = this.getStatus(key, isHealthy);

        if (isHealthy) {
            return result;
        }
        throw new HealthCheckError('Redischeck failed', result);
    }
}



import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
    constructor(){
        super()
    }


  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const result = this.getStatus(key, true);

    if (true) {
      return result;
    }
    throw new HealthCheckError('Redischeck failed', result);
  }
}

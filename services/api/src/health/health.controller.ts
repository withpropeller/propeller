import { Public } from '@common/decorators/public-request.decorator';
import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { HealthCheckService, HealthCheck, MemoryHealthIndicator } from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health.indicator';

@Controller('health')
@Public()
export class HealthController {
    constructor(
        private health: HealthCheckService,
        // private mongoose: MongooseHealthIndicator,
        private redis: RedisHealthIndicator,
        private memory: MemoryHealthIndicator,
    ) {}

    @Get()
    @HealthCheck()
    @ApiExcludeEndpoint()
    check() {
        return this.health.check([
            //  async () => this.redis.isHealthy("redis"),
            //async () => this.mongoose.pingCheck('mongoose'),
            // async () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
            // async () => this.memory.checkRSS('memory_rss', 3000 * 1024 * 1024),
        ]);
    }
}

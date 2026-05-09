import { Module } from '@nestjs/common';
import { CoreModule } from '@core/core.module';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { CustomExceptionFilter } from '@core/exceptions/custom-exception.filter';
import { ApiModule } from '@api/api.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { HttpExceptionFilter } from '@core/exceptions/http-exception.filter';
import { CommonModule } from '@common/common.module';
import { PermissionsGuard, SecureGuard, ThrottlerBehindProxyGuard } from '@core/guards';

@Module({
    imports: [
        CoreModule,
        CommonModule,
        ApiModule,
        ThrottlerModule.forRoot({
            ttl: 1000, // 1000 transactions in  1 second
            limit: 1000,
        }),
        HealthModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerBehindProxyGuard,
        },
        {
            provide: APP_GUARD,
            useClass: SecureGuard,
        },
        {
            provide: APP_GUARD,
            useClass: PermissionsGuard,
        },
        {
            provide: APP_FILTER,
            useClass: HttpExceptionFilter,
        },
        {
            provide: APP_FILTER,
            useClass: CustomExceptionFilter,
        },
    ],
})
export class AppModule {}

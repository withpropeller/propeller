import { Module } from '@nestjs/common';
import { CoreModule } from '@core/core.module';
import { ApiModule } from '@api/api.module';
import { AuthModule } from '@auth/auth.module';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { JwtAuthGuard } from '@auth/guards';
import { UsersModule } from './api/users/users.module';
import { CustomExceptionFilter } from '@core/exceptions/custom-exception.filter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { HttpExceptionFilter } from '@core/exceptions/http-exception.filter';
import { BusinessModule } from '@api/business/business.module';
import { CommonModule } from '@common/common.module';
import { PermissionsGuard } from '@auth/guards/permission.guard';

@Module({
    imports: [
        CoreModule,
        CommonModule,
        ApiModule,
        AuthModule,
        UsersModule,
        BusinessModule,
        ThrottlerModule.forRoot({
            ttl: 60,
            limit: 600,
        }),
        HealthModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
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

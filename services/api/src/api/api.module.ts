import { LoggingInterceptor } from '@core/interceptors/logging.interceptor';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ApiLogsModule } from './api-logs/api-logs.module';
import { ApiMiddleware } from './api.middleware';
import { CustomerModule } from './customer/customer.module';
import { E2EController } from './e2e.controller';
import { EventModule } from './events/event.module';
import { PaymentRequestModule } from './payment-requests/payment-request.module';
import { PaymentModule } from './payments/payment.module';
import { SecretKeyModule } from './secret-keys/secret-key.module';
import { ToolsModule } from './tools/tools.module';
import { WebhookModule } from './webhooks/webhook.module';
import { FeeModule } from './fees/fee.module';
import { RequestExceptionInterceptor } from '@core/interceptors/request-exception.interceptor';

@Module({
    imports: [
        SecretKeyModule,
        ApiLogsModule,
        CustomerModule,
        WebhookModule,
        EventModule,
        PaymentModule,
        PaymentRequestModule,
        ToolsModule,
        FeeModule,
    ],
    controllers: [E2EController],
    providers: [
        { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
        { provide: APP_INTERCEPTOR, useClass: RequestExceptionInterceptor },
    ],
})
export class ApiModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        return consumer.apply(ApiMiddleware).exclude('/health').forRoutes('/');
    }
}

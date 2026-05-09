import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TenantDataSource } from '@core/helpers';
import { MongooseModule } from '@nestjs/mongoose';
import { Billing, BillingSchema } from './billing.schema';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { Business, BusinessSchema } from '@api/business/business.schema';
import { AdminsModule } from '@api/admins/admin.module';
import { AccountModule } from '@api/account/account.module';
import { ConfigurationModule } from '@api/configuration/configuration.module';
import { PaymentModule } from '@api/payments/payment.module';
import { LiveModeRoutesMiddleware } from '@core/middlewares';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }], TenantDataSource.Core),
        MongooseModule.forFeature([{ name: Billing.name, schema: BillingSchema }], TenantDataSource.Live),
        AdminsModule,
        ConfigurationModule,
        AccountModule,
        PaymentModule,
    ],
    providers: [BillingService],
    controllers: [BillingController],
    exports: [],
})
export class BillingModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        return consumer.apply(LiveModeRoutesMiddleware).forRoutes(BillingController);
    }
}

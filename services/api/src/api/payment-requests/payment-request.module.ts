import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantDataSource } from '@core/helpers';
import { CommonModule } from '@common/common.module';
import { PaymentRequestService } from './payment-request.service';
import { PaymentRequest, PaymentRequestSchema } from './payment-request.schema';
import { PaymentRequestController } from './payment-request.controller';
import { BusinessModule } from '@models/business/business.module';
import { CustomerModule } from '@api/customer/customer.module';
import { AccountModule } from '@api/account/account.module';
import { ConfigurationModule } from '@api/tools/configuration/configuration.module';
import { NIBSS_DIRECT_DEBIT_INTEGRATION_PROVIDER } from '@common/integrations/integrations.providers';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [
        HttpModule,
        CommonModule,
        MongooseModule.forFeature([{ name: PaymentRequest.name, schema: PaymentRequestSchema }], TenantDataSource.Live),
        MongooseModule.forFeature(
            [{ name: PaymentRequest.name, schema: PaymentRequestSchema }],
            TenantDataSource.Sandbox,
        ),
        BusinessModule,
        CustomerModule,
        AccountModule,
        ConfigurationModule,
    ],
    controllers: [PaymentRequestController],
    providers: [PaymentRequestService, NIBSS_DIRECT_DEBIT_INTEGRATION_PROVIDER],
    exports: [PaymentRequestService],
})
export class PaymentRequestModule {}

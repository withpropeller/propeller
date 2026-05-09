import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantDataSource } from '@core/helpers';
import { CommonModule } from '@common/common.module';
import { Payment, PaymentSchema } from './payment.schema';
import { PayoutPaymentService } from './payout.payment.service';
import { PaymentController } from './payment.controller';
import { AccountModule } from '@api/account/account.module';
import { CustomerModule } from '@api/customer/customer.module';
import { BusinessModule } from '@models/business/business.module';
import { ToolsModule } from '@api/tools/tools.module';
import { ConfigurationModule } from '@api/tools/configuration/configuration.module';
import { FeeModule } from '@api/fees/fee.module';
import { PaymentService } from './payment.service';
import { ChargePaymentService } from './charge.payment.services';
import { EventModule } from '@api/events/event.module';
import { BillPaymentService } from './bill-payment.service';

@Module({
    imports: [
        CommonModule,
        MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }], TenantDataSource.Live),
        MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }], TenantDataSource.Sandbox),

        BusinessModule,
        CustomerModule,
        AccountModule,
        ToolsModule,
        ConfigurationModule,
        FeeModule,
        EventModule,
    ],
    controllers: [PaymentController],
    providers: [PayoutPaymentService, PaymentService, ChargePaymentService, BillPaymentService],
    exports: [PaymentService, PayoutPaymentService, ChargePaymentService, BillPaymentService],
})
export class PaymentModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantDataSource } from '@core/helpers/enums';
import { Payment, PaymentSchema } from './payment.schema';
import { ReservePayment, ReservePaymentSchema } from '../reserve-payments/reserve-payments.schema';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { AuditModule } from '@api/audit/audit.module';
import { CommonModule } from '@common/common.module';
import { ToolsModule } from '@api/tools/tools.module';
import { Business, BusinessSchema } from '@api/business/business.schema';
import { AdminsModule } from '@api/admins/admin.module';
import { ProvipayService } from '@common/integrations/provipay.service';

@Module({
    imports: [
        CommonModule,
        ToolsModule,
        MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }], TenantDataSource.Core),
        MongooseModule.forFeature(
            [
                { name: Payment.name, schema: PaymentSchema },
                { name: ReservePayment.name, schema: ReservePaymentSchema },
            ],
            TenantDataSource.Live,
        ),
        MongooseModule.forFeature(
            [
                { name: Payment.name, schema: PaymentSchema },
                { name: ReservePayment.name, schema: ReservePaymentSchema },
            ],
            TenantDataSource.Sandbox,
        ),
        AuditModule,
        AdminsModule,
    ],
    controllers: [PaymentController],
    providers: [PaymentService, ProvipayService],
    exports: [PaymentService],
})
export class PaymentModule {}

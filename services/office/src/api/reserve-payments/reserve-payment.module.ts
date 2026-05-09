import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantDataSource } from '@core/helpers/enums';
import { ReservePayment, ReservePaymentSchema } from './reserve-payments.schema';
import { ReservePaymentService } from './reserve-payment.service';
import { ReservePaymentController } from './reserve-payment.controller';
import { AuditModule } from '@api/audit/audit.module';
import { CommonModule } from '@common/common.module';
import { ToolsModule } from '@api/tools/tools.module';
import { Business, BusinessSchema } from '@api/business/business.schema';
import { AdminsModule } from '@api/admins/admin.module';
import { ReserveAccount, ReserveAccountSchema } from '@api/reserve-accounts/reserve-accounts.schema';

@Module({
    imports: [
        CommonModule,
        ToolsModule,
        MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }], TenantDataSource.Core),
        MongooseModule.forFeature(
            [
                { name: ReserveAccount.name, schema: ReserveAccountSchema },
                { name: ReservePayment.name, schema: ReservePaymentSchema },
            ],
            TenantDataSource.Live,
        ),
        MongooseModule.forFeature(
            [
                { name: ReserveAccount.name, schema: ReserveAccountSchema },
                { name: ReservePayment.name, schema: ReservePaymentSchema },
            ],
            TenantDataSource.Sandbox,
        ),
        AuditModule,
        AdminsModule,
    ],
    controllers: [ReservePaymentController],
    providers: [ReservePaymentService],
    exports: [ReservePaymentService],
})
export class ReservePaymentModule {}

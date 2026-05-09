import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillProduct, BillProductSchema } from './bill-product.schema';
import { BillProductService } from './bill-product.service';
import { BillingProductController } from './billing.controller';
import { TenantDataSource } from '@core/helpers';
import { AdminsModule } from '@api/admins/admin.module';
import { AuditModule } from '@api/audit/audit.module';
import { CommonModule } from '@common/common.module';

@Module({
    imports: [
        AdminsModule,
        AuditModule,
        CommonModule,
        MongooseModule.forFeature([{ name: BillProduct.name, schema: BillProductSchema }], TenantDataSource.Sandbox),
        MongooseModule.forFeature([{ name: BillProduct.name, schema: BillProductSchema }], TenantDataSource.Live),
    ],
    controllers: [BillingProductController],
    providers: [BillProductService],
})
export class BillingModule {}

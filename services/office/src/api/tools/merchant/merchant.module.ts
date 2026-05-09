import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { MerchantController } from './merchant.controller';
import { Merchant, MerchantSchema } from './merchant.schema';
import { TenantDataSource } from '@core/helpers';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminsModule } from '@api/admins/admin.module';
import { AuditModule } from '@api/audit/audit.module';
import { CommonModule } from '@common/common.module';

@Module({
    imports: [
        HttpModule,
        AdminsModule,
        AuditModule,
        CommonModule,
        MongooseModule.forFeature([{ name: Merchant.name, schema: MerchantSchema }], TenantDataSource.Core),
    ],
    providers: [MerchantService],
    controllers: [MerchantController],
    exports: [],
})
export class MerchantModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessService } from './business.service';
import { TenantDataSource } from '@core/helpers';
import { Business, BusinessSchema } from './business.schema';
import { BusinessKYC, BusinessKYCSchema } from './business-kyc.schema';
import { BusinessKYCService } from './business-kyc.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }], TenantDataSource.Core),
        MongooseModule.forFeature([{ name: BusinessKYC.name, schema: BusinessKYCSchema }], TenantDataSource.Core),
    ],
    providers: [BusinessService, BusinessKYCService],
    exports: [BusinessService, BusinessKYCService],
})
export class BusinessModule {}

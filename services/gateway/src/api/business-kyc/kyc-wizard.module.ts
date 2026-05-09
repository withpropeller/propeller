import { HttpModule } from '@nestjs/axios';
import { BusinessModule } from '@api/business/business.module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessKYCController } from './business-kyc.controller';
import { BusinessKYC, BusinessKYCSchema } from './business-kyc.schema';
import { KYCWizardService } from './business-kyc.service';
// BVN removed
import { TenantDataSource } from '@core/helpers/enums';
import { CommonModule } from '@common/common.module';

@Module({
    imports: [
        HttpModule,
        CommonModule,
        MongooseModule.forFeature([{ name: BusinessKYC.name, schema: BusinessKYCSchema }], TenantDataSource.Core),
        //  RolesModule,
        // UsersModule,
        BusinessModule,
    ],
    controllers: [BusinessKYCController],
    providers: [KYCWizardService],
    exports: [KYCWizardService],
})
export class KycWizardModule {}

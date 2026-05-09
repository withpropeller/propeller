import { RolesModule } from '@api/roles/roles.module';
import { UsersModule } from '@api/users';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { Business, BusinessSchema } from './business.schema';
import { AccountModule } from '@api/account/account.module';
import { TenantDataSource } from '@core/helpers';
import { BusinessConsumer } from './business.consumer';
import { ConfigurationModule } from '@api/configuration/configuration.module';
import { CommonModule } from '@common/common.module';
import { BusinessKYCService } from './business-kyc.service';
import { BusinessKYC, BusinessKYCSchema } from './business-kyc.schema';

@Module({
    imports: [
        CommonModule,
        MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }], TenantDataSource.Core),
        MongooseModule.forFeature([{ name: BusinessKYC.name, schema: BusinessKYCSchema }], TenantDataSource.Core),
        AccountModule,
        RolesModule,
        UsersModule,
        ConfigurationModule,
    ],
    providers: [BusinessService, BusinessConsumer, BusinessKYCService],
    controllers: [BusinessController],
    exports: [BusinessService, BusinessConsumer, BusinessKYCService],
})
export class BusinessModule {}

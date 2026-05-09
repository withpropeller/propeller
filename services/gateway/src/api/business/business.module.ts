import { RolesModule } from '@api/roles/roles.module';
import { UsersModule } from '@api/users';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { Business, BusinessSchema } from './business.schema';
import { AccountModule } from '@api/account/account.module';
import { TenantDataSource } from '@core/helpers';

import { ConfigurationModule } from '@api/configuration/configuration.module';
import { CommonModule } from '@common/common.module';

@Module({
    imports: [
        CommonModule,
        MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }], TenantDataSource.Core),
        AccountModule,
        RolesModule,
        UsersModule,
        ConfigurationModule,
    ],
    controllers: [BusinessController],
    providers: [BusinessService],
    exports: [BusinessService],
})
export class BusinessModule {}

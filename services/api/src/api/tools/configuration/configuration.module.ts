import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantDataSource } from '@core/helpers/enums';
import { BusinessModule } from '@models/business/business.module';
import { ConfigurationService } from './configuration.service';
import { Configuration, ConfigurationSchema } from './configuration.schema';
import { ConfigurationController } from './configuration.controller';
import { AccountModule } from '@api/account/account.module';
import { FeeModule } from '@api/fees/fee.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Configuration.name, schema: ConfigurationSchema }], TenantDataSource.Live),
        MongooseModule.forFeature(
            [{ name: Configuration.name, schema: ConfigurationSchema }],
            TenantDataSource.Sandbox,
        ),
        AccountModule,
        FeeModule,
        BusinessModule,
    ],
    controllers: [ConfigurationController],
    providers: [ConfigurationService],
    exports: [ConfigurationService],
})
export class ConfigurationModule {}

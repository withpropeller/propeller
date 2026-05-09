import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantDataSource } from '@core/helpers/enums';
import { ConfigurationService } from './configuration.service';
import { Configuration, ConfigurationSchema } from './configuration.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name:  Configuration.name, schema:  ConfigurationSchema }], TenantDataSource.Live),
        MongooseModule.forFeature([{ name:  Configuration.name, schema:  ConfigurationSchema }], TenantDataSource.Sandbox),
    ],
    providers: [ ConfigurationService],
    exports: [ ConfigurationService],
})
export class ConfigurationModule {}

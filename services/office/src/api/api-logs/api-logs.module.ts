import { TenantDataSource } from '@core/helpers';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiLogsController } from './api-logs.controller';
import { ApiLogsService } from './api-logs.service';
import { ApiRequest, ApiLogSchema } from './api-log.schema';
import { User, UserSchema } from '@api/users';
import { Business, BusinessSchema } from '@api/business/business.schema';
import { EnvoyService } from '@common/envoy';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }], TenantDataSource.Core),
        MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }], TenantDataSource.Core),
        MongooseModule.forFeature([{ name: ApiRequest.name, schema: ApiLogSchema }], TenantDataSource.Sandbox),
        MongooseModule.forFeature([{ name: ApiRequest.name, schema: ApiLogSchema }], TenantDataSource.Live),
    ],
    controllers: [ApiLogsController],
    providers: [ApiLogsService, EnvoyService],
    exports: [ApiLogsService],
})
export class ApiLogsModule {}

import { TenantDataSource } from '@core/helpers';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiLogsController } from './api-logs.controller';
import { ApiLogsService } from './api-logs.service';
import { ApiRequest, ApiLogsSchema } from './api-log.schema';
import { User, UserSchema } from '@api/users';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }], TenantDataSource.Core),
        MongooseModule.forFeature([{ name: ApiRequest.name, schema: ApiLogsSchema }], TenantDataSource.Sandbox),
        MongooseModule.forFeature([{ name: ApiRequest.name, schema: ApiLogsSchema }], TenantDataSource.Live),
    ],
    controllers: [ApiLogsController],
    providers: [ApiLogsService],
    exports: [ApiLogsService],
})
export class ApiLogsModule {}

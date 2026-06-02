import { TenantDataSource } from '@core/helpers';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiRequestsController } from './api-requests.controller';
import { ApiRequestsService } from './api-requests.service';
import { ApiRequest, ApiRequestsSchema } from './api-request.schema';
import { User, UserSchema } from '@api/users';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }], TenantDataSource.Core),
        MongooseModule.forFeature([{ name: ApiRequest.name, schema: ApiRequestsSchema }], TenantDataSource.Sandbox),
        MongooseModule.forFeature([{ name: ApiRequest.name, schema: ApiRequestsSchema }], TenantDataSource.Live),
    ],
    controllers: [ApiRequestsController],
    providers: [ApiRequestsService],
    exports: [ApiRequestsService],
})
export class ApiRequestsModule {}

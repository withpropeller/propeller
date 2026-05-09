import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiRequest, ApiLogsSchema } from './api-logs.schema';
import { TenantDataSource } from '@core/helpers/enums';
import { ApiLogsService } from './api-logs.service';
import { ApiLogsListener } from './api-logs.listener';
import { Webhook, WebhookSchema } from '@api/webhooks/webhooks.schema';
import { ApiLogsController } from './api-logs.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: ApiRequest.name, schema: ApiLogsSchema }], TenantDataSource.Sandbox),
        MongooseModule.forFeature([{ name: ApiRequest.name, schema: ApiLogsSchema }], TenantDataSource.Live),

        MongooseModule.forFeature([{ name: Webhook.name, schema: WebhookSchema }], TenantDataSource.Live),
        MongooseModule.forFeature([{ name: Webhook.name, schema: WebhookSchema }], TenantDataSource.Sandbox),
    ],
    controllers: [ApiLogsController],
    providers: [ApiLogsService, ApiLogsListener],
    exports: [ApiLogsService],
})
export class ApiLogsModule {}

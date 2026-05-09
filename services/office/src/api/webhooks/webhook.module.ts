import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantDataSource } from '@core/helpers';
import { Webhook, WebhookSchema } from './webhooks.schema';
import { WebhookService } from './webhooks.service';
import { WebhookController } from './webhook.controller';
import { Business, BusinessSchema } from '@api/business/business.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }], TenantDataSource.Core),

        MongooseModule.forFeature([{ name: Webhook.name, schema: WebhookSchema }], TenantDataSource.Live),
        MongooseModule.forFeature([{ name: Webhook.name, schema: WebhookSchema }], TenantDataSource.Sandbox),
    ],
    controllers: [WebhookController],
    providers: [WebhookService],
    exports: [WebhookService],
})
export class WebhookModule {}

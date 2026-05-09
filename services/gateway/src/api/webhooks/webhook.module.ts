import { Module } from '@nestjs/common';
import { WebhookService } from './webhooks.service';
import { WebhookController } from './webhook.controller';

@Module({
    imports: [],
    controllers: [WebhookController],
    providers: [WebhookService],
    exports: [WebhookService],
})
export class WebhookModule {}

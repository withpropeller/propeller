import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantDataSource } from '@core/helpers';
import { EventService } from './events.service';
import { CommonModule } from '@common/common.module';
import { EventAttempt, EventAttemptSchema, EventSchema } from './event.schema';
import { EventsController } from './events.controller';
import { WebhookModule } from '@api/webhooks/webhook.module';

@Module({
    imports: [
        CommonModule,
        MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }], TenantDataSource.Live),
        MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }], TenantDataSource.Sandbox),

        MongooseModule.forFeature([{ name: EventAttempt.name, schema: EventAttemptSchema }], TenantDataSource.Live),
        MongooseModule.forFeature([{ name: EventAttempt.name, schema: EventAttemptSchema }], TenantDataSource.Sandbox),

        WebhookModule,
    ],
    controllers: [EventsController],
    providers: [EventService],
    exports: [EventService],
})
export class EventModule {}

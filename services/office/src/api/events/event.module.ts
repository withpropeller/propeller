import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantDataSource } from '@core/helpers';
import { EventService } from './events.service';
import { EventAttempt, EventAttemptSchema, Event, EventSchema } from './event.schema';
import { EventsController } from './events.controller';
import { Business, BusinessSchema } from '@api/business/business.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }], TenantDataSource.Core),

        MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }], TenantDataSource.Live),
        MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }], TenantDataSource.Sandbox),

        MongooseModule.forFeature([{ name: EventAttempt.name, schema: EventAttemptSchema }], TenantDataSource.Live),
        MongooseModule.forFeature([{ name: EventAttempt.name, schema: EventAttemptSchema }], TenantDataSource.Sandbox),
    ],
    controllers: [EventsController],
    providers: [EventService],
    exports: [EventService],
})
export class EventsModule {}

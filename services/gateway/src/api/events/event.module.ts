import { Module } from '@nestjs/common';
import { EventsController } from './event.controller';
import { EventsService  } from './event.service';

@Module({
    imports: [],
    controllers: [EventsController],
    providers:  [EventsService],
    exports: [EventsService],
})
export class EventsModule {}

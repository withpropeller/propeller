import { Module } from '@nestjs/common';
import { EventsController } from './event.controller';
import { EventsService } from './event.service';
import { ConfigModule } from '@config/config.module';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [HttpModule, ConfigModule],
    controllers: [EventsController],
    providers: [EventsService],
    exports: [EventsService],
})
export class EventsModule {}

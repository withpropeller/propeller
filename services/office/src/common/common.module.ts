import { Module } from '@nestjs/common';
import { EnvoyService } from './envoy';
import { ReporterService } from './services/reporter.service';
import { NotificationHandler } from './notifications/notification-handler.service';
import { StorageService } from './services/storage.service';

@Module({
    imports: [],
    providers: [EnvoyService, NotificationHandler, ReporterService, StorageService],
    exports: [EnvoyService, NotificationHandler, ReporterService, StorageService],
})
export class CommonModule {}

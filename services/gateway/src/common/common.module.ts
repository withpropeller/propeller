import { Module } from '@nestjs/common';
import { EnvoyService } from './envoy/envoy.service';
import { NotificationHandler } from './notifications/notification-handler.service';
import { StorageService } from './integrations/storage.service';
import { ReporterService } from './services/reporter.service';
import { FloService } from '@core/services/flo.service';

@Module({
    imports: [],
    providers: [FloService, EnvoyService, NotificationHandler, ReporterService, StorageService],
    exports: [FloService, EnvoyService, NotificationHandler, ReporterService, StorageService],
})
export class CommonModule {}

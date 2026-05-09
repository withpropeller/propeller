import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EnvoyService } from './envoy/envoy.service';
import { ReporterService } from './services/reporter.service';
import { StorageService } from './services/storage.service';

@Module({
    imports: [HttpModule],
    providers: [EnvoyService, ReporterService, StorageService],
    exports: [EnvoyService, ReporterService, StorageService],
})
export class CommonModule {}

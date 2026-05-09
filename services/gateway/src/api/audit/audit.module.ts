import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Audit, AuditSchema } from './audit.schema';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { TenantDataSource } from '@core/helpers';

@Global()
@Module({
    imports: [
        MongooseModule.forFeature([{ name: Audit.name, schema: AuditSchema }], TenantDataSource.Live),
        MongooseModule.forFeature([{ name: Audit.name, schema: AuditSchema }], TenantDataSource.Sandbox),
    ],
    controllers: [AuditController],
    providers: [AuditService],
    exports: [AuditService],
})
export class AuditModule {}

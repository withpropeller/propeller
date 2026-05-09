import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Audit, AuditSchema } from './audit.schema';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { TenantDataSource } from '@core/helpers';
import { AdminAuditController } from './admin-audit.controller';
import { AdminAuditService } from './admin-audit.service';
import { AdminAudit, AdminAuditSchema } from './admin-audit.schema';
import { CommonModule } from '@common/common.module';
import { Business, BusinessSchema } from '@api/business/business.schema';

@Global()
@Module({
    imports: [
        CommonModule,
        MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }], TenantDataSource.Core),
        MongooseModule.forFeature([{ name: Audit.name, schema: AuditSchema }], TenantDataSource.Live),
        MongooseModule.forFeature([{ name: Audit.name, schema: AuditSchema }], TenantDataSource.Sandbox),

        MongooseModule.forFeature([{ name: AdminAudit.name, schema: AdminAuditSchema }], TenantDataSource.Live),
        MongooseModule.forFeature([{ name: AdminAudit.name, schema: AdminAuditSchema }], TenantDataSource.Sandbox),
    ],
    controllers: [AuditController, AdminAuditController],
    providers: [AuditService, AdminAuditService],
    exports: [AdminAuditService],
})
export class AuditModule {}

import { AuditModule } from '@api/audit/audit.module';
import { BusinessModule } from '@api/business/business.module';
import { TenantDataSource } from '@core/helpers';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SecretKeyController } from './secret-key.controller';
import { SecretKey, SecretKeySchema } from './secret-key.schema';
import { SecretKeyService } from './secret-key.service';
import { Business, BusinessSchema } from '@api/business/business.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }], TenantDataSource.Core),

        MongooseModule.forFeature([{ name: SecretKey.name, schema: SecretKeySchema }], TenantDataSource.Sandbox),
        MongooseModule.forFeature([{ name: SecretKey.name, schema: SecretKeySchema }], TenantDataSource.Live),
        BusinessModule,
        AuditModule,
    ],
    controllers: [SecretKeyController],
    providers: [SecretKeyService],
    exports: [SecretKeyService],
})
export class SecretKeyModule {}

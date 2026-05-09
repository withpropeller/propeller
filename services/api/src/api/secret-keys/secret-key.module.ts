import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SecretKeyService } from './secret-key.service';
import { SecretKey, SecretKeySchema } from './secret-key.schema';
import { TenantDataSource } from '@core/helpers/enums';
import { SecretKeyListener } from './secret-key.listener';
@Module({
    imports: [
        MongooseModule.forFeature([{ name: SecretKey.name, schema: SecretKeySchema }], TenantDataSource.Sandbox),
        MongooseModule.forFeature([{ name: SecretKey.name, schema: SecretKeySchema }], TenantDataSource.Live),
    ],
    providers: [SecretKeyService, SecretKeyListener],
    exports: [SecretKeyService],
})
export class SecretKeyModule {}

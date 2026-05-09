import { Module } from '@nestjs/common';
import { Admin, AdminSchema } from './admin.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantDataSource } from '@core/helpers/enums';
import { AdminService } from './admin.service';
import { CommonModule } from '@common/common.module';
import { AdminConsumer } from './admin.consumer';
import { AdminsController } from './admin.controller';

@Module({
    imports: [
        CommonModule,
        MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }], TenantDataSource.Office),
    ],
    controllers: [AdminsController],
    providers: [AdminService, AdminConsumer],
    exports: [AdminService],
})
export class AdminsModule {}

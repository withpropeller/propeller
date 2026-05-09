import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantDataSource } from '@core/helpers';
import { Fee, FeeSchema } from './fee.schema';
import { FeeController } from './fee.controller';
import { FeeService } from './fee.service';
import { CommonModule } from '@common/common.module';
import { AccountModule } from '@api/account/account.module';
import { BusinessModule } from '@models/business/business.module';

@Module({
    imports: [
        CommonModule,
        MongooseModule.forFeature([{ name: Fee.name, schema: FeeSchema }], TenantDataSource.Live),
        MongooseModule.forFeature([{ name: Fee.name, schema: FeeSchema }], TenantDataSource.Sandbox),
        BusinessModule,
        AccountModule,
    ],
    controllers: [FeeController],
    providers: [FeeService],
    exports: [FeeService],
})
export class FeeModule {}

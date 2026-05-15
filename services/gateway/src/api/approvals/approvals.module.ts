import { Module } from '@nestjs/common';
import { Approval, ApprovalSchema } from './approvals.schema';
import { ApprovalService } from './approvals.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ApprovalController } from './approvals.controller';
import { TenantDataSource } from '@core/helpers/enums';
import { BusinessModule } from '@api/business/business.module';
import { CommonModule } from '@common/common.module';
import { UsersModule } from '@api/users';

@Module({
    imports:[
        CommonModule,
        MongooseModule.forFeature([{ name: Approval.name, schema: ApprovalSchema }], TenantDataSource.Core),
        BusinessModule,
        UsersModule,
    ],
    providers: [ApprovalService],
    controllers: [ApprovalController],
    exports: [ApprovalService],
})
export class ApprovalModule { }

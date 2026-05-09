import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantDataSource } from '@core/helpers/enums';
import { SettlementAccountService } from './settlement-account.service';
import {
    SettlementAccount,
    SettlementAccountLog,
    SettlementAccountLogSchema,
    SettlementAccountSchema,
} from './settlement-account.schema';
import { SettlementAccountController } from './settlement-account.controller';
import { CommonModule } from '@common/common.module';
import { AdminsModule } from '@api/admins/admin.module';

@Module({
    imports: [
        CommonModule,
        AdminsModule,
        MongooseModule.forFeature(
            [
                {
                    name: SettlementAccountLog.name,
                    schema: SettlementAccountLogSchema,
                },
                {
                    name: SettlementAccount.name,
                    schema: SettlementAccountSchema,
                },
            ],
            TenantDataSource.Office,
        ),
    ],
    controllers: [SettlementAccountController],
    providers: [SettlementAccountService],
    exports: [SettlementAccountService],
})
export class SettlementAccountModule {}

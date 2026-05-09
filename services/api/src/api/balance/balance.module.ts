import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantDataSource } from '@core/helpers';
import { CommonModule } from '@common/common.module';
import { Account, AccountSchema } from '@api/account/accounts.schema';
import { BalanceService } from './balance.service';
import { Balance, BalanceHistory, BalanceHistorySchema, BalanceSchema } from './balance.schema';

@Module({
    imports: [
        CommonModule,
        MongooseModule.forFeature(
            [
                { name: Account.name, schema: AccountSchema },
                { name: Balance.name, schema: BalanceSchema },
                { name: BalanceHistory.name, schema: BalanceHistorySchema },
            ],
            TenantDataSource.Live,
        ),
        MongooseModule.forFeature(
            [
                { name: Account.name, schema: AccountSchema },
                { name: Balance.name, schema: BalanceSchema },
                { name: BalanceHistory.name, schema: BalanceHistorySchema },
            ],
            TenantDataSource.Sandbox,
        ),
    ],
    controllers: [],
    providers: [BalanceService],
    exports: [BalanceService],
})
export class BalanceModule {}

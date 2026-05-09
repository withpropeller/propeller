import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantDataSource } from '@core/helpers';
import { Balance, BalanceHistory, BalanceHistorySchema, BalanceSchema } from './balance.schema';
import { BalanceService } from './balance.service';
import { GRPCModule } from '@common/grpc/grpc.module';

@Module({
    imports: [
        GRPCModule,
        MongooseModule.forFeature(
            [
                { name: Balance.name, schema: BalanceSchema },
                { name: BalanceHistory.name, schema: BalanceHistorySchema },
            ],
            TenantDataSource.Live,
        ),
        MongooseModule.forFeature(
            [
                { name: Balance.name, schema: BalanceSchema },
                { name: BalanceHistory.name, schema: BalanceHistorySchema },
            ],
            TenantDataSource.Sandbox,
        ),
    ],
    providers: [BalanceService],
    exports: [BalanceService],
})
export class BalanceModule {}

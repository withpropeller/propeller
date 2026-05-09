import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from './accounts.schema';
import { TenantDataSource } from '@core/helpers/enums';
import { CustomerModule } from '@api/customer/customer.module';
import { BusinessModule } from '@models/business/business.module';
import { AccountLog, AccountLogSchema } from './account-logs.schema';
import { TransferService } from '@api/tools';
import { CommonModule } from '@common/common.module';
import { HttpModule } from '@nestjs/axios';
import { BalanceModule } from '@api/balance/balance.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }], TenantDataSource.Live),
        MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }], TenantDataSource.Sandbox),

        MongooseModule.forFeature([{ name: AccountLog.name, schema: AccountLogSchema }], TenantDataSource.Live),
        MongooseModule.forFeature([{ name: AccountLog.name, schema: AccountLogSchema }], TenantDataSource.Sandbox),
        HttpModule,
        CommonModule,
        CustomerModule,
        BusinessModule,
        BalanceModule,
    ],
    controllers: [AccountController],
    providers: [AccountService, TransferService],
    exports: [AccountService],
})
export class AccountModule {}

import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from './accounts.schema';
import { TenantDataSource } from '@core/helpers/enums';
import { AccountLog, AccountLogSchema } from './account-logs.schema';
import { CommonModule } from '@common/common.module';
import { Business, BusinessSchema } from '@api/business/business.schema';
import { CustomerModule } from '@api/customer/customer.module';
import { BusinessKYC, BusinessKYCSchema } from '@api/business/business-kyc.schema';
import { TransferService } from '@api/tools/banks/banks.service';
import { BalanceModule } from '@api/balance/balance.module';

@Module({
    imports: [
        CommonModule,
        BalanceModule,
        MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }], TenantDataSource.Core),
        MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }], TenantDataSource.Live),
        MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }], TenantDataSource.Sandbox),

        MongooseModule.forFeature([{ name: AccountLog.name, schema: AccountLogSchema }], TenantDataSource.Live),
        MongooseModule.forFeature([{ name: AccountLog.name, schema: AccountLogSchema }], TenantDataSource.Sandbox),

        MongooseModule.forFeature([{ name: BusinessKYC.name, schema: BusinessKYCSchema }], TenantDataSource.Core),

        CustomerModule,
    ],
    controllers: [AccountController],
    providers: [AccountService, TransferService],
    exports: [AccountService],
})
export class AccountModule {}

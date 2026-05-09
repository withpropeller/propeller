import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from './accounts.schema';
import { TenantDataSource } from '@core/helpers/enums';
import { CommonModule } from '@common/common.module';

@Module({
    imports: [
        CommonModule,
        MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }], TenantDataSource.Live),
        MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }], TenantDataSource.Sandbox),
    ],
    controllers: [AccountController],
    providers: [AccountService],
    exports: [AccountService],
})
export class AccountModule {}

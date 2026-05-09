import { Module } from '@nestjs/common';
import { ReserveAccountService } from './reserve-account.service';
import { ReserveAccountController } from './reserve-account.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ReserveAccount, ReserveAccountSchema } from './reserve-accounts.schema';
import { TenantDataSource } from '@core/helpers/enums';
import { BalanceModule } from '@api/balance/balance.module';
import { CommonModule } from '@common/common.module';
import { AdminsModule } from '@api/admins/admin.module';
import { AuditModule } from '@api/audit/audit.module';
import { SettlementAccountModule } from '@api/settlement-accounts/settlement-account.module';
import { ReservePaymentModule } from '@api/reserve-payments/reserve-payment.module';

@Module({
    imports: [
        CommonModule,
        BalanceModule,
        AdminsModule,
        AuditModule,
        MongooseModule.forFeature([{ name: ReserveAccount.name, schema: ReserveAccountSchema }], TenantDataSource.Live),
        MongooseModule.forFeature(
            [{ name: ReserveAccount.name, schema: ReserveAccountSchema }],
            TenantDataSource.Sandbox,
        ),
        SettlementAccountModule,
        ReservePaymentModule,
    ],
    controllers: [ReserveAccountController],
    providers: [ReserveAccountService],
    exports: [ReserveAccountService],
})
export class ReserveAccountModule {}

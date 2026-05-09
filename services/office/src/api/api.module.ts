import { Module } from '@nestjs/common';
import { E2EController } from './e2e.controller';
import { BusinessModule } from './business/business.module';
import { ApprovalModule } from './approvals/approvals.module';
import { CardProgramModule } from './card-program/card-program.module';
import { ToolsModule } from './tools/tools.module';
import { ReserveAccountModule } from './reserve-accounts/reserve-account.module';
import { CardAuthorizationModule } from './card-authorizations/card-authorization.module';
import { CardsModule } from './cards/cards.module';
import { AccountModule } from './account/account.module';
import { AuditModule } from './audit/audit.module';
import { WebhookModule } from './webhooks/webhook.module';
import { EventsModule } from './events/event.module';
import { PaymentModule } from './payments/payment.module';
import { ProfileModule } from './profile/profile.module';
import { SettlementAccountModule } from './settlement-accounts/settlement-account.module';
import { CardTransactionModule } from './card-transactions/card-transaction.module';
import { CustomerModule } from './customer/customer.module';
import { DisputeModule } from './dispute/dispute.module';
import { SecretKeyModule } from './secret-keys/secret-key.module';
import { ApiLogsModule } from './api-logs/api-logs.module';
import { AdminsModule } from './admins/admin.module';
import { UsersModule } from './users';
import { BillingModule } from './billing/billing.module';
import { CardBinModule } from './card-bins/card-bin.module';
import { ReservePaymentModule } from './reserve-payments/reserve-payment.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';

@Module({
    imports: [
        SecretKeyModule,
        ProfileModule,
        AuditModule,
        BusinessModule,
        ApprovalModule,
        PaymentModule,
        ReservePaymentModule,
        CardBinModule,
        CardProgramModule,
        ToolsModule,
        ReserveAccountModule,
        CardAuthorizationModule,
        AccountModule,
        CardsModule,
        EventsModule,
        WebhookModule,
        SettlementAccountModule,
        CardTransactionModule,
        CustomerModule,
        DisputeModule,
        ApiLogsModule,
        AdminsModule,
        UsersModule,
        BillingModule,
        ReconciliationModule,
        /*KycWizardModule,
       
        SimulationModule,,*/
    ],
    controllers: [E2EController],
    providers: [],
})
export class ApiModule {}

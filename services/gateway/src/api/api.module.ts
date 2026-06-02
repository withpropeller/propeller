import { Module } from '@nestjs/common';
import { ProfileModule } from './profile';
import { E2EController } from './e2e.controller';
import { BusinessModule } from './business/business.module';
import { KycWizardModule } from './business-kyc/kyc-wizard.module';
import { ApprovalModule } from './approvals/approvals.module';
import { AccountModule } from './account/account.module';
import { SecretKeyModule } from './secret-keys/secret-key.module';
import { AuditModule } from './audit/audit.module';
import { CustomersModule } from './customers/customers.module';
import { WebhookModule } from './webhooks/webhook.module';
import { ApiRequestsModule } from './api-requests/api-requests.module';
import { EventsModule } from './events/event.module';
import { PaymentModule } from './payments/payment.module';
import { PaymentRequestModule } from './payment-requests/payment-requests.module';
import { ToolsModule } from './tools/tools.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TeamModule } from './team/team.module';

@Module({
    imports: [
        SecretKeyModule,
        AuditModule,
        ProfileModule,
        BusinessModule,
        ApprovalModule,
        KycWizardModule,
        AccountModule,
        CustomersModule,
        EventsModule,
        WebhookModule,
        ApiRequestsModule,
        PaymentModule,
        PaymentRequestModule,
        ToolsModule,
        DashboardModule,
        TeamModule,
    ],
    controllers: [E2EController],
})
export class ApiModule {}

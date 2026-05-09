import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantDataSource } from '@core/helpers/enums';
import { WebhookModule } from '@api/webhooks/webhook.module';
import { Dispute, DisputeSchema } from './dispute.schema';
import { DisputeController } from './dispute.controller';
import { DisputeService } from './dispute.service';
import { PaymentModule } from '@api/payments/payment.module';
import { CommonModule } from '@common/common.module';
import { CardTransactionModule } from '@api/card-transactions/card-transaction.module';
import { Business, BusinessSchema } from '@api/business/business.schema';
import { EventsModule } from '@api/events/event.module';
import { AdminsModule } from '@api/admins/admin.module';
import { CardAuthorizationModule } from '@api/card-authorizations/card-authorization.module';
import { ReserveAccountModule } from '@api/reserve-accounts/reserve-account.module';

@Module({
    imports: [
        CommonModule,
        MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }], TenantDataSource.Core),
        MongooseModule.forFeature([{ name: Dispute.name, schema: DisputeSchema }], TenantDataSource.Live),
        MongooseModule.forFeature([{ name: Dispute.name, schema: DisputeSchema }], TenantDataSource.Sandbox),
        CardTransactionModule,
        PaymentModule,
        AdminsModule,
        EventsModule,
        WebhookModule,
        CardAuthorizationModule,
        ReserveAccountModule,
    ],
    controllers: [DisputeController],
    providers: [DisputeService],
})
export class DisputeModule {}

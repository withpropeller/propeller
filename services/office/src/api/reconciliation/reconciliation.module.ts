import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantDataSource } from '@core/helpers/enums';
import { ReconciliationService } from './reconciliation.service';
import { ReconciliationController } from './reconciliation.controller';
import {
    AccountStatement,
    AccountStatementSchema,
    ReconciliationRun,
    ReconciliationRunSchema,
} from './reconciliation.schema';
import { CardAuthorization, CardAuthorizationSchema } from '@api/card-authorizations/card-authorization.schema';
import { Payment, PaymentSchema } from '@api/payments/payment.schema';
import { ReservePayment, ReservePaymentSchema } from '@api/reserve-payments/reserve-payments.schema';

@Module({
    imports: [
        MongooseModule.forFeature(
            [
                { name: AccountStatement.name, schema: AccountStatementSchema },
                { name: ReconciliationRun.name, schema: ReconciliationRunSchema },
            ],
            TenantDataSource.Office,
        ),
        MongooseModule.forFeature(
            [
                { name: CardAuthorization.name, schema: CardAuthorizationSchema },
                { name: Payment.name, schema: PaymentSchema },
                { name: ReservePayment.name, schema: ReservePaymentSchema },
            ],
            TenantDataSource.Live,
        ),
    ],
    controllers: [ReconciliationController],
    providers: [ReconciliationService],
    exports: [ReconciliationService],
})
export class ReconciliationModule {}

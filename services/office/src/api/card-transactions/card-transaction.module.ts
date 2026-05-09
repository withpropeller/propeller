import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantDataSource } from '@core/helpers';
import { CardTransaction, CardTransactionSchema } from './card-transaction.schema';
import { CardTransactionController } from './card-transaction.controller';
import { CardTransactionService } from './card-transaction.service';
import { Business, BusinessSchema } from '@api/business/business.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }], TenantDataSource.Core),
        MongooseModule.forFeature(
            [{ name: CardTransaction.name, schema: CardTransactionSchema }],
            TenantDataSource.Live,
        ),
        MongooseModule.forFeature(
            [{ name: CardTransaction.name, schema: CardTransactionSchema }],
            TenantDataSource.Sandbox,
        ),
    ],
    controllers: [CardTransactionController],
    providers: [CardTransactionService],
    exports: [CardTransactionService],
})
export class CardTransactionModule {}

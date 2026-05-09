import { Module } from '@nestjs/common';
import { CardsService } from './cards.service';
import { TenantDataSource } from '@core/helpers';
import { MongooseModule } from '@nestjs/mongoose';
import { Card, CardSchema } from './cards.schema';
import { AccountModule } from '@api/account/account.module';
import { CardsController } from './cards.controller';
import { Business, BusinessSchema } from '@api/business/business.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }], TenantDataSource.Core),
        MongooseModule.forFeature([{ name: Card.name, schema: CardSchema }], TenantDataSource.Live),
        MongooseModule.forFeature([{ name: Card.name, schema: CardSchema }], TenantDataSource.Sandbox),
        AccountModule,
    ],
    controllers: [CardsController],
    providers: [CardsService],
    exports: [CardsService],
})
export class CardsModule {}

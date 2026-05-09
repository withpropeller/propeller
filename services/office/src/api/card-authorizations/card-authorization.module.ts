import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantDataSource } from '@core/helpers';
import { CardAuthorizationController } from './card-authorization.controller';
import { CardAuthorization, CardAuthorizationSchema } from './card-authorization.schema';
import { CardAuthorizationService } from './card-authorization.service';
import { Business, BusinessSchema } from '@api/business/business.schema';
import { AdminsModule } from '@api/admins/admin.module';
import { AccountModule } from '@api/account/account.module';
import { CardProgramModule } from '@api/card-program/card-program.module';
import { CardsModule } from '@api/cards/cards.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }], TenantDataSource.Core),
        MongooseModule.forFeature(
            [{ name: CardAuthorization.name, schema: CardAuthorizationSchema }],
            TenantDataSource.Live,
        ),
        MongooseModule.forFeature(
            [{ name: CardAuthorization.name, schema: CardAuthorizationSchema }],
            TenantDataSource.Sandbox,
        ),
        AdminsModule,
        AccountModule,
        CardsModule,
        CardProgramModule,
    ],
    controllers: [CardAuthorizationController],
    providers: [CardAuthorizationService],
    exports: [CardAuthorizationService],
})
export class CardAuthorizationModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantDataSource } from '@core/helpers/enums';
import { CardProgram, CardProgramSchema } from './card-program.schema';
import { CardProgramController } from './card-program.controller';
import { CardProgramService } from './card-program.service';
import { CardsModule } from '@api/cards/cards.module';
import { AuditModule } from '@api/audit/audit.module';
import { Business, BusinessSchema } from '@api/business/business.schema';
import { AdminsModule } from '@api/admins/admin.module';
import { CardBinModule } from '@api/card-bins/card-bin.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }], TenantDataSource.Core),
        MongooseModule.forFeature([{ name: CardProgram.name, schema: CardProgramSchema }], TenantDataSource.Sandbox),
        MongooseModule.forFeature([{ name: CardProgram.name, schema: CardProgramSchema }], TenantDataSource.Live),
        CardsModule,
        AuditModule,
        AdminsModule,
        CardBinModule,
    ],
    controllers: [CardProgramController],
    providers: [CardProgramService],
    exports: [CardProgramService],
})
export class CardProgramModule {}

import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantDataSource } from '@core/helpers/enums';
import { HttpModule } from '@nestjs/axios';
import { CardBin, CardBinSchema } from './card-bin.schema';
import { CardBinService } from './card-bin.service';
import { CardBinController } from './card-bin.controller';
import { CommonModule } from '@common/common.module';
import { Business, BusinessSchema } from '@api/business/business.schema';

@Module({
    imports: [
        HttpModule,
        CommonModule,
        MongooseModule.forFeature([{ name: Business.name, schema: BusinessSchema }], TenantDataSource.Core),
        MongooseModule.forFeature([{ name: CardBin.name, schema: CardBinSchema }], TenantDataSource.Live),
        MongooseModule.forFeature([{ name: CardBin.name, schema: CardBinSchema }], TenantDataSource.Sandbox),
    ],
    controllers: [CardBinController],
    providers: [CardBinService],
    exports: [CardBinService],
})
export class CardBinModule {}

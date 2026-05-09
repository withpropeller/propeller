import { Module } from '@nestjs/common';
import { BanksController } from './banks/banks.controller';
import { TransferService } from './banks/banks.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigurationModule } from './configuration/configuration.module';
import { ToolsService } from './tools.service';
import { CommonModule } from '@common/common.module';
import { FxController } from './fx/fx.controller';
import { FxService } from './fx/fx.service';
import { MerchantModule } from './merchant/merchant.module';

@Module({
    imports: [HttpModule, CommonModule, ConfigurationModule, MerchantModule],
    controllers: [BanksController, FxController],
    providers: [TransferService, ToolsService, FxService],
    exports: [TransferService, ToolsService, FxService],
})
export class ToolsModule {}

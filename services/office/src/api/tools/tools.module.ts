import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AuditModule } from '@api/audit/audit.module';
import { ToolsSettingsController } from './tools-settings.controller';
import { ToolsService } from './tools.services';
import { TransferService } from './banks/banks.service';
import { BanksController } from './banks/banks.controller';
import { AdminsModule } from '@api/admins/admin.module';
import { ToolsProvidusController } from './tools-providus.controller';
import { CommonModule } from '@common/common.module';
import { MerchantModule } from './merchant/merchant.module';
import { BillingModule } from './billing/billing.module';
import { FxController } from './fx/fx.controller';
import { FxService } from './fx/fx.service';

@Module({
    imports: [HttpModule, CommonModule, AuditModule, AdminsModule, MerchantModule, BillingModule],
    providers: [ToolsService, TransferService, FxService],
    controllers: [BanksController, ToolsSettingsController, ToolsProvidusController, FxController],
    exports: [TransferService, ToolsService, FxService],
})
export class ToolsModule {}

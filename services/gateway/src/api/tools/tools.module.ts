import { Module } from '@nestjs/common';
import { ToolsController } from './tools.controller';
import { ToolsService } from './tools.service';
import { HttpModule } from '@nestjs/axios';
import { CommonModule } from '@common/common.module';
@Module({
    imports: [HttpModule, CommonModule],
    controllers: [ToolsController],
    providers: [ToolsService],
})
export class ToolsModule {}

import { PermissionsGuard } from '@auth/guards/permission.guard';
import { CurrentUser, Permission } from '@common/decorators';
import { Permissions } from '@api/roles/roles.enums';
import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
    AddFeeSettingsDto,
    FeeDto,
    HashSetDto,
    TransactionCategoriesDto,
    UpdateFxRateDto,
    UpdateTransferSettingsDto,
} from './tools.dto';
import { ToolsService } from './tools.services';
import { ParamIdDto } from '@common/dtos';
import { JWTUser } from '@auth/jwt.strategy';
import { Request } from 'express';
import { RedisService } from '@core/services';
import { RedisKeys } from '@core/helpers';

@ApiTags('tools/settings')
@Controller('tools/settings')
@UseGuards(PermissionsGuard)
export class ToolsSettingsController {
    constructor(private service: ToolsService, private redisService: RedisService) {}

    @ApiOperation({ summary: 'Get All Fees List' })
    @Get('/fees')
    @Permission(Permissions.ToolsFeesSettingsRead)
    public async getFeesList() {
        return this.service.getKeyValueJsonSettings<FeeDto>(RedisKeys.FeesSettings);
    }

    @ApiOperation({ summary: 'Update Multiple Fees Settings' })
    @Put('/fees')
    @Permission(Permissions.ToolsFeesSettingsUpdate)
    public async addFeeList(@Body() body: AddFeeSettingsDto) {
        return this.service.addKeyValueJsonSettings(RedisKeys.FeesSettings, body.fees, 'type');
    }

    @ApiOperation({ summary: 'Delete One Fee Settings' })
    @Delete('/fees/:id')
    @Permission(Permissions.ToolsFeesSettingsDelete)
    public async removeFees(@Param() param: ParamIdDto) {
        return this.service.removeKeyValueJsonSettings(RedisKeys.FeesSettings, param.id);
    }

    @ApiOperation({ summary: 'Update Current Exchange Rate' })
    @Put('/fx/rates')
    @Permission(Permissions.ToolsFxSettingsUpdate)
    public async getExchangeRate(@Body() body: UpdateFxRateDto) {
        return this.service.updateExchangeRate(body);
    }

    @ApiOperation({ summary: 'Get Current Exchange Rates' })
    @Get('/fx/rates')
    @Permission(Permissions.ToolsFxSettingsRead)
    public async getExchangeRates() {
        return this.service.getExchangeRates();
    }

    @ApiOperation({ summary: 'Get Transfer Settings' })
    @Get('/transfer/:id')
    @Permission(Permissions.ToolsTransferSettingsRead)
    public async getTransferSettings(@Param() param: ParamIdDto) {
        return this.service.getTransferSettings(param.id);
    }

    @ApiOperation({ summary: 'Update Transfer Settings' })
    @Put('/transfer')
    @Permission(Permissions.ToolsTransferSettingsUpdate)
    public async updateTransferSettings(
        @CurrentUser() user: JWTUser,
        @Req() req: Request,
        @Body() body: UpdateTransferSettingsDto,
    ) {
        return this.service.updateTransferSettings(user.userId, body, req);
    }

    @ApiOperation({ summary: 'Get All Transaction Categories' })
    @Get('/categories')
    @Permission(Permissions.ToolsTransactionSettingsUpdate)
    public async getTransactionCategories() {
        return this.service.getTransactionCategories();
    }

    @ApiOperation({ summary: 'Add Transaction Categories' })
    @Post('/categories')
    @Permission(Permissions.ToolsTransactionSettingsUpdate)
    public async createTransactionCategories(@Body() body: TransactionCategoriesDto) {
        return this.service.addTransactionCategories(body);
    }

    @ApiOperation({ summary: 'Update Transaction Categories' })
    @Put('/categories')
    @Permission(Permissions.ToolsTransactionSettingsUpdate)
    public async setTransactionCategory(@Body() body: HashSetDto) {
        await this.redisService.hashSet(RedisKeys.CategorySettings, body.key, body.value);
    }
}

import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Permissions } from '@api/roles';
import {
    CurrentUser,
    Permission,
    ApiResponseWrapper,
    ApiResponseListWrapper,
    ApiBasicResponse,
    ApiCommonResponse,
} from '@common/decorators';
import { APIPagingDto } from '@common/api-paging';
import { SettlementAccountService } from './settlement-account.service';
import { Request, Response } from 'express';
import { MetricsQueryDto, ParamTagIdDto } from '@common/dtos';
import {
    TransferSettlementAccountDto,
    SettlementAccountBalanceDto,
    SettlementLogMetricsDto,
} from './settlement-account.dto';
import { JWTUser } from '@auth/jwt.strategy';
import { ApiHydratedSettlementAccount, ApiHydratedSettlementAccountLog } from './settlement-account.schema';

@ApiTags('settlement-accounts')
@Controller('settlement-accounts')
export class SettlementAccountController {
    constructor(private service: SettlementAccountService) {}

    @ApiOperation({ summary: 'Get All Settlement Accounts' })
    @ApiBearerAuth()
    @Permission(Permissions.SettlementAccountsRead)
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiResponseListWrapper(ApiHydratedSettlementAccount, 200, 'Settlement accounts retrieved successfully')
    @ApiCommonResponse()
    public async getAll(@Query() query: APIPagingDto) {
        return this.service.repo.findByQuery(query);
    }

    @ApiOperation({ summary: 'Get One Settlement Account Balance' })
    @ApiBearerAuth()
    @Permission(Permissions.SettlementAccountsReadBalance)
    @Get('/balance')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Balance retrieved successfully')
    @ApiCommonResponse()
    public async getOneBalance() {
        return this.service.getOneBalance();
    }

    @ApiOperation({ summary: 'Get All Settlement Accounts Balance' })
    @ApiBearerAuth()
    @Permission(Permissions.SettlementAccountsReadBalance)
    @Get('/balances')
    @HttpCode(HttpStatus.OK)
    @ApiResponseListWrapper(SettlementAccountBalanceDto, 200, 'Balances retrieved successfully')
    @ApiCommonResponse()
    public async getAllBalances() {
        return this.service.getAllBalances();
    }

    @ApiOperation({ summary: 'Get Settlement Account Logs' })
    @ApiBearerAuth()
    @Permission(Permissions.SettlementAccountsReadLogs)
    @Get('/logs')
    @HttpCode(HttpStatus.OK)
    @ApiResponseListWrapper(ApiHydratedSettlementAccountLog, 200, 'Settlement account logs retrieved successfully')
    @ApiCommonResponse()
    public async getLogs(@Query() query: APIPagingDto) {
        return this.service.logRepo.findByQuery(query);
    }

    @ApiOperation({ summary: 'Get Settlement Account Log Metrics' })
    @ApiBearerAuth()
    @Permission(Permissions.SettlementAccountsReadLogs)
    @Get('/logs/metrics')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(SettlementLogMetricsDto, 200, 'Settlement log metrics retrieved successfully')
    @ApiCommonResponse()
    public async getLogsMetrics(@Query() query: MetricsQueryDto) {
        return this.service.getLogsMetrics(query);
    }

    @ApiOperation({ summary: 'Get Settlement Account Logs as CSV' })
    @ApiBearerAuth()
    @Permission(Permissions.SettlementAccountsReadLogs)
    @Get('/logs/csv')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'CSV file download')
    @ApiCommonResponse()
    public async getLogsCSV(@Res() res: Response, @Query() query: APIPagingDto) {
        const [csvText, fileName] = await this.service.getLogsCSV(query);

        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(csvText);
    }

    @ApiOperation({ summary: 'Get One Settlement Account' })
    @ApiBearerAuth()
    @Permission(Permissions.SettlementAccountsRead)
    @ApiParam({ name: 'id', description: 'Settlement Account ID', type: String })
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedSettlementAccount, 200, 'Settlement account retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Settlement account not found')
    public async getOne(@Param() params: ParamTagIdDto) {
        return this.service.repo.findOne({ _id: params.id });
    }

    @ApiOperation({ summary: 'Get Settlement Account Balance' })
    @ApiBearerAuth()
    @Permission(Permissions.SettlementAccountsReadBalance)
    @ApiParam({ name: 'id', description: 'Settlement Account ID', type: String })
    @Get('/:id/balance')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Balance retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Settlement account not found')
    public async getBalance(@Param() params: ParamTagIdDto) {
        return this.service.getBalance(params.id);
    }

    @ApiOperation({ summary: 'Transfer Settlement Account Balance' })
    @ApiBearerAuth()
    @Permission(Permissions.SettlementAccountsTransfer)
    @ApiParam({ name: 'id', description: 'Settlement Account ID', type: String })
    @Post('/:id/transfer')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Transfer initiated successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Settlement account not found')
    public async transfer(
        @CurrentUser() user: JWTUser,
        @Param() params: ParamTagIdDto,
        @Body() body: TransferSettlementAccountDto,
        @Req() req: Request,
        @Query() query: APIPagingDto,
    ) {
        return this.service.transfer(user.userId, params.id, body, req, query);
    }
}

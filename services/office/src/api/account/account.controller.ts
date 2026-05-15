import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
    Permission,
    ApiResponseWrapper,
    ApiResponseListWrapper,
    ApiBasicResponse,
    ApiCommonResponse,
} from '@common/decorators';
import { Permissions } from '@api/roles';
import { AccountService } from './account.service';
import { PermissionsGuard } from '@auth/guards/permission.guard';
import { Response } from 'express';
import { APIPagingDto } from '@common/api-paging';
import { MetricsQueryDto, ParamTagIdDto } from '@common/dtos';
import { AccountMetricsDto, AddDepositChannelDto, RefreshDepositChannelDto, SetDepositChannelDto } from './account.dto';
import { ApiHydratedAccount } from './accounts.schema';
import { ApiHydratedAccountLog } from './account-logs.schema';

@ApiTags('accounts')
@Controller('accounts')
@UseGuards(PermissionsGuard)
export class AccountController {
    constructor(private service: AccountService) {}

    @ApiOperation({ summary: 'Get All Accounts' })
    @ApiBearerAuth()
    @Permission(Permissions.AccountsRead)
    @Get('/')
    @HttpCode(HttpStatus.OK)
    @ApiResponseListWrapper(ApiHydratedAccount, 200, 'Accounts retrieved successfully')
    @ApiCommonResponse()
    public async get(@Query() query: any) {
        return this.service.getAll(query);
    }

    @ApiOperation({ summary: 'Get Account Metrics' })
    @ApiBearerAuth()
    @Permission(Permissions.AccountsRead)
    @Get('metrics')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(AccountMetricsDto, 200, 'Account metrics retrieved successfully')
    @ApiCommonResponse()
    public async getMetrics(@Query() query: MetricsQueryDto) {
        return this.service.getMetrics(query);
    }

    @ApiOperation({ summary: 'Get Total Balance' })
    @ApiBearerAuth()
    @Permission(Permissions.AccountsReadBalance)
    @Get('/total-balance')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Total balance retrieved successfully')
    @ApiCommonResponse()
    public async getTotalBalance() {
        return this.service.getTotalBalance();
    }

    @ApiOperation({ summary: 'Get One Account' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Account ID', type: String })
    @Permission(Permissions.AccountsRead)
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedAccount, 200, 'Account retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Account not found')
    public async getOne(@Query() query: any, @Param() param: ParamTagIdDto) {
        return this.service.getOne(param.id, query);
    }

    @ApiOperation({ summary: 'Get Balance History' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Account ID', type: String })
    @Permission(Permissions.AccountsReadLogs)
    @Get(':id/balance/history')
    @HttpCode(HttpStatus.OK)
    @ApiResponseListWrapper(ApiHydratedAccountLog, 200, 'Balance history retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Account not found')
    public async getBalanceHistory(@Param() param: ParamTagIdDto, @Query() query: APIPagingDto) {
        return this.service.getBalanceHistory(param.id, query);
    }

    @ApiOperation({ summary: 'Download Balance Logs in CSV' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Account ID', type: String })
    @Permission(Permissions.AccountsReadLogs)
    @Get('/:id/balance/history/csv')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'CSV file download')
    @ApiCommonResponse()
    public async getBalanceHistoryCSV(
        @Param() param: ParamTagIdDto,
        @Query() query: APIPagingDto,
        @Res() res: Response,
    ) {
        const [csvText, fileName] = await this.service.getBalanceHistoryCSV(param.id, query);

        res.writeHead(200, {
            'Content-Type': 'text/csv',
            'Content-Length': Buffer.byteLength(csvText),
            'Content-Disposition': `attachment; filename="${fileName}"`,
        });
        res.write(csvText);
        res.end();
    }

    @ApiOperation({ summary: 'Get Balance' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Account ID', type: String })
    @Permission(Permissions.AccountsReadBalanceAll)
    @Get('/:id/balance')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Balance retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Account not found')
    public async getBalance(@Param() param: ParamTagIdDto, @Query() query: APIPagingDto) {
        return this.service.getBalance(param.id, query);
    }

    @ApiOperation({ summary: 'Update Deposit Channel Account Name', description: 'Refresh the deposit channel account name from the linked financial account. This is useful when the account name has changed and needs to be updated in Propeller.' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Account ID', type: String })
    @Permission(Permissions.AccountsUpdateDepositChannel)
    @Put('/:id/deposit-channels/update-account-name')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedAccount, 200, 'Deposit channel updated successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Account not found')
    public updateDepositChannel(
        @Body() body: RefreshDepositChannelDto,
        @Query() query: APIPagingDto,
        @Param() param: ParamTagIdDto,
    ) {
        return this.service.refreshDepositChannelAccountName(param.id, body, query);
    }

    @ApiOperation({ summary: 'Add Deposit Channel' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Account ID', type: String })
    @Permission(Permissions.AccountsUpdateDepositChannel)
    @Post('/:id/deposit-channels')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedAccount, 200, 'Deposit channel added successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Account not found')
    public addDepositChannel(
        @Body() body: AddDepositChannelDto,
        @Query() query: APIPagingDto,
        @Param() param: ParamTagIdDto,
    ) {
        return this.service.addDepositChannel(param.id, body, query);
    }

    @ApiOperation({ summary: 'Set Deposit Channel Account Name' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Account ID', type: String })
    @Permission(Permissions.AccountsUpdateDepositChannel)
    @Put('/:id/deposit-channels/set-account-name')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedAccount, 200, 'Deposit channel account name set successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Account not found')
    public setDepositChannel(
        @Body() body: SetDepositChannelDto,
        @Query() query: APIPagingDto,
        @Param() param: ParamTagIdDto,
    ) {
        return this.service.setDepositChannelAccountName(param.id, body, query);
    }
}

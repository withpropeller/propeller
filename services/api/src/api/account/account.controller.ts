import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAccessKey, Permission } from '@common/decorators';
import { APIPagingDto } from '@common/api-paging';
import { AccountService } from './account.service';
import { ParamIdDto, ParamTagIdDto } from '@common/dtos';
import { AccessKey } from '@core/interfaces';
import { SecretKeyPermissions as Permissions } from '@api/secret-keys';
import { AddDepositChannelDto, CreateAccountDto, GenerateStatementDto, RefreshDepositChannelDto } from './account.dto';

@ApiTags('accounts')
@Controller('accounts')
export class AccountController {
    constructor(private service: AccountService) {}

    @ApiOperation({ summary: 'Get All Accounts' })
    @Permission(Permissions.AccountsRead)
    @Get('/')
    public getAccounts(@CurrentAccessKey() key: AccessKey, @Query() query: APIPagingDto) {
        return this.service.repo.findByQuery(query, {
            business: key.businessId,
        });
    }

    @ApiOperation({ summary: 'Get One Account' })
    @Permission(Permissions.AccountsRead)
    @Get('/:id')
    public async getOne(@CurrentAccessKey() key: AccessKey, @Query() query: APIPagingDto, @Param() param: ParamIdDto) {
        return this.service.findByIdOrReference(key.businessId, param.id, query);
    }

    @ApiOperation({ summary: 'Get Balance History' })
    @Permission(Permissions.AccountsReadLogs)
    @Get(':id/balance/history')
    public async getBalanceHistory(
        @CurrentAccessKey() key: AccessKey,
        @Param() param: ParamTagIdDto,
        @Query() query: APIPagingDto,
    ) {
        return this.service.getBalanceHistory(key.businessId, param.id, query);
    }

    @ApiOperation({ summary: 'Download Balance Logs in CSV' })
    @Permission(Permissions.AccountsReadLogs)
    @Get('/:id/balance/history/csv')
    public async getBalanceHistoryCSV(
        @CurrentAccessKey() key: AccessKey,
        @Param() param: ParamTagIdDto,
        @Query() query: APIPagingDto,
        @Res() res: Response,
    ) {
        const [csvText, fileName] = await this.service.getBalanceHistoryCSV(key.businessId, param.id, query);

        res.writeHead(200, {
            'Content-Type': 'text/csv',
            'Content-Length': Buffer.byteLength(csvText),
            'Content-Disposition': `attachment; filename="${fileName}"`,
        });
        res.write(csvText);
        res.end();
    }

    @ApiOperation({ summary: 'Download Statement in PDF' })
    @Permission(Permissions.AccountsReadLogs)
    @Get('/:id/statement/pdf')
    public async getStatementPDF(
        @CurrentAccessKey() key: AccessKey,
        @Param() param: ParamTagIdDto,
        @Query() query: GenerateStatementDto,
        @Res() res: Response,
    ) {
        const [pdfBuffer, fileName] = await this.service.getStatementPDF(key.businessId, param.id, query);

        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Length': Buffer.byteLength(pdfBuffer),
            'Content-Disposition': `attachment; filename="${fileName}"`,
        });
        res.write(pdfBuffer);
        res.end();
    }

    @ApiOperation({ summary: 'Create Account' })
    @Permission(Permissions.AccountsCreate)
    @Post()
    public create(@CurrentAccessKey() key: AccessKey, @Body() body: CreateAccountDto, @Query() query: APIPagingDto) {
        return this.service.create(key.businessId, body, query);
    }

    @ApiOperation({ summary: 'Get Balance' })
    @Permission(Permissions.AccountsReadBalance)
    @Get('/:id/balance')
    public async getBalance(@CurrentAccessKey() key: AccessKey, @Param() param: ParamTagIdDto) {
        return this.service.getBalance(key.businessId, param.id);
    }

    @ApiOperation({ summary: 'Add Deposit Channel' })
    @Permission(Permissions.AccountsUpdateDepositChannel)
    @Post('/:id/deposit-channels')
    @HttpCode(HttpStatus.OK)
    public addDepositChannel(
        @CurrentAccessKey() key: AccessKey,
        @Body() body: AddDepositChannelDto,
        @Query() query: APIPagingDto,
        @Param() param: ParamTagIdDto,
    ) {
        return this.service.addDepositChannels(key.businessId, param.id, body, query);
    }

    @ApiOperation({ summary: 'Update Deposit Channel Account Name' })
    @Permission(Permissions.AccountsUpdateDepositChannel)
    @Put('/:id/deposit-channels/update-account-name')
    @HttpCode(HttpStatus.OK)
    public updateDepositChannel(
        @CurrentAccessKey() key: AccessKey,
        @Body() body: RefreshDepositChannelDto,
        @Query() query: APIPagingDto,
        @Param() param: ParamTagIdDto,
    ) {
        return this.service.updateDepositChannelAccountName(key.businessId, param.id, body, query);
    }
}

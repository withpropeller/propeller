import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Permission } from '@common/decorators';
import { Permissions } from '@api/roles';
import { AccountService } from './account.service';
import { JWTUser } from '@auth/jwt.strategy';
import { Response } from 'express';
import { ParamTagIdDto } from '@common/dtos';
import { RequestOverdraftDto } from './account.dto';

@ApiTags('accounts')
@Controller('accounts')
export class AccountController {
    constructor(private service: AccountService) {}

    @ApiOperation({ summary: 'Get All Accounts' })
    @Permission(Permissions.AccountsRead)
    @Get('/')
    public async get(@Res() res: Response, @CurrentUser() user: JWTUser, @Query() query: any) {
        const response = await this.service.get(user, query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get One Account' })
    @Permission(Permissions.AccountsRead)
    @Get('/:id')
    public async getOne(@Res() res: Response, @CurrentUser() user: JWTUser, @Query() query: any, @Param() param: any) {
        const response = await this.service.getOne(user, param.id, query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Create Accounts' })
    @Permission(Permissions.AccountsCreate)
    @Post()
    public async create(@CurrentUser() user: JWTUser, @Body() body: any, @Res() res: Response) {
        const response = await this.service.create(user, body);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get Account Balance' })
    @Permission(Permissions.AccountsReadBalance)
    @Get('/:id/balance')
    public async getBalance(@Res() res: Response, @CurrentUser() user: JWTUser, @Param() param: any) {
        const response = await this.service.getIdAction(user, param.id, 'balance');
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Request Credit Limit Approval' })
    @Permission(Permissions.AccountsRequestCreditLimit)
    @Post('/:id/credit-limit')
    public async requestCreditLimitApproval(
        @CurrentUser() user: JWTUser,
        @Param() params: ParamTagIdDto,
        @Body() body: RequestOverdraftDto,
    ) {
        await this.service.requestCreditLimitApproval(user.userId, params.id, body);
        return 'Credit Limit Approval Request successful';
    }

    @ApiOperation({ summary: 'Get Balance Log' })
    @Permission(Permissions.AccountsReadLogs)
    @Get(':id/balance/history')
    public async getLogs(@Res() res: Response, @CurrentUser() user: JWTUser, @Query() query: any, @Param() param: any) {
        const response = await this.service.getIdAction(user, param.id, 'balance/history', query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get Balance Log in CSV' })
    @Permission(Permissions.AccountsReadLogs)
    @Get(':id/balance/history/csv')
    public async getLogCSV(
        @Res() res: Response,
        @CurrentUser() user: JWTUser,
        @Query() query: any,
        @Param() param: any,
    ) {
        const response = await this.service.getIdAction(user, param.id, 'balance/history/csv', query);
        for (const key in response.headers) {
            res.header(key, response.headers[key] as string);
        }
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Download Statement in PDF' })
    @Permission(Permissions.AccountsReadLogs)
    @Get('/:id/statement/pdf')
    public async getStatementPDF(
        @CurrentUser() user: JWTUser,
        @Param() param: any,
        @Query() query: any,
        @Res() res: Response,
    ) {
        const response = await this.service.getIdAction(user, param.id, 'statement/pdf', query);
        for (const key in response.headers) {
            res.header(key, response.headers[key] as string);
        }
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Add Deposit Channel' })
    @Permission(Permissions.AccountsUpdateDepositChannel)
    @Post('/:id/deposit-channels')
    public async addDepositChannel(
        @Res() res: Response,
        @CurrentUser() user: JWTUser,
        @Body() body: any,
        @Param() param: any,
    ) {
        const response = await this.service.postIdAction(user, param.id, 'deposit-channels', body);
        res.status(response.status).send(response.data);
    }
}

import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
    CurrentUser,
    Permission,
    ApiResponseWrapper,
    ApiResponseListWrapper,
    ApiBasicResponse,
    ApiCommonResponse,
} from '@common/decorators';
import { Permissions } from '@api/roles';
import { AccountService } from './account.service';
import { JWTUser } from '@auth/jwt.strategy';
import { Response } from 'express';
import { CreateAccountDto, AddDepositChannelDto } from './account.dto';
import { ApiHydratedAccount } from './accounts.schema';
import { APIPagingDto } from '@common/api-paging';

@ApiTags('accounts')
@Controller('accounts')
export class AccountController {
    constructor(private service: AccountService) {}

    @ApiOperation({ summary: 'Get All Accounts' })
    @ApiBearerAuth()
    @Permission(Permissions.AccountsRead)
    @Get('/')
    @HttpCode(HttpStatus.OK)
    @ApiResponseListWrapper(ApiHydratedAccount, 200, 'Accounts retrieved successfully')
    @ApiCommonResponse()
    public async get(@Res() res: Response, @CurrentUser() user: JWTUser, @Query() query: APIPagingDto) {
        console.log('Query parameters:', query); // Debug log to check incoming query parameters
        const response = await this.service.get(user, query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get One Account' })
    @ApiBearerAuth()
    @Permission(Permissions.AccountsRead)
    @ApiParam({ name: 'id', description: 'Account ID', type: String })
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedAccount, 200, 'Account retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Account not found')
    public async getOne(
        @Res() res: Response,
        @CurrentUser() user: JWTUser,
        @Query() query: APIPagingDto,
        @Param() param: any,
    ) {
        const response = await this.service.getOne(user, param.id, query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Create Account' })
    @ApiBearerAuth()
    @Permission(Permissions.AccountsCreate)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiResponseWrapper(ApiHydratedAccount, 201, 'Account created successfully')
    @ApiCommonResponse()
    public async create(@CurrentUser() user: JWTUser, @Body() body: CreateAccountDto, @Res() res: Response) {
        const response = await this.service.create(user, body);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get Account Balance' })
    @ApiBearerAuth()
    @Permission(Permissions.AccountsReadBalance)
    @ApiParam({ name: 'id', description: 'Account ID', type: String })
    @Get('/:id/balance')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Account balance retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Account not found')
    public async getBalance(@Res() res: Response, @CurrentUser() user: JWTUser, @Param() param: any) {
        const response = await this.service.getIdAction(user, param.id, 'balance');
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get Balance History' })
    @ApiBearerAuth()
    @Permission(Permissions.AccountsReadLogs)
    @ApiParam({ name: 'id', description: 'Account ID', type: String })
    @Get(':id/balance/history')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Balance history retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Account not found')
    public async getLogs(
        @Res() res: Response,
        @CurrentUser() user: JWTUser,
        @Query() query: APIPagingDto,
        @Param() param: any,
    ) {
        const response = await this.service.getIdAction(user, param.id, 'balance/history', query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Download Balance History CSV' })
    @ApiBearerAuth()
    @Permission(Permissions.AccountsReadLogs)
    @ApiParam({ name: 'id', description: 'Account ID', type: String })
    @Get(':id/balance/history/csv')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Balance history CSV file')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Account not found')
    public async getLogCSV(
        @Res() res: Response,
        @CurrentUser() user: JWTUser,
        @Query() query: APIPagingDto,
        @Param() param: any,
    ) {
        const response = await this.service.getIdAction(user, param.id, 'balance/history/csv', query);
        for (const key in response.headers) {
            res.header(key, response.headers[key] as string);
        }
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Download Statement PDF' })
    @ApiBearerAuth()
    @Permission(Permissions.AccountsReadLogs)
    @ApiParam({ name: 'id', description: 'Account ID', type: String })
    @Get('/:id/statement/pdf')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Account statement PDF file')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Account not found')
    public async getStatementPDF(
        @CurrentUser() user: JWTUser,
        @Param() param: any,
        @Query() query: APIPagingDto,
        @Res() res: Response,
    ) {
        const response = await this.service.getIdAction(user, param.id, 'statement/pdf', query);
        for (const key in response.headers) {
            res.header(key, response.headers[key] as string);
        }
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Add Deposit Channel' })
    @ApiBearerAuth()
    @Permission(Permissions.AccountsUpdateDepositChannel)
    @ApiParam({ name: 'id', description: 'Account ID', type: String })
    @Post('/:id/deposit-channels')
    @HttpCode(HttpStatus.CREATED)
    @ApiBasicResponse(201, 'Deposit channel added successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Account not found')
    public async addDepositChannel(
        @Res() res: Response,
        @CurrentUser() user: JWTUser,
        @Body() body: AddDepositChannelDto,
        @Param() param: any,
    ) {
        const response = await this.service.postIdAction(user, param.id, 'deposit-channels', body);
        res.status(response.status).send(response.data);
    }
}

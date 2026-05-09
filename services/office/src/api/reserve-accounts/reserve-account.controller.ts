import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Permission } from '@common/decorators';
import { Permissions } from '@api/roles';
import { ReserveAccountService } from './reserve-account.service';
import { PermissionsGuard } from '@auth/guards/permission.guard';
import { ParamTagIdDto } from '@common/dtos';
import { JWTUser } from '@auth/jwt.strategy';
import { AddDepositChannelDto, CreateReserveAccountDto, DebitReserveAccountDto } from './reserve-account.dto';
import { Request } from 'express';
import { APIPagingDto } from '@common/api-paging';
import { TransferSettlementAccountDto } from '@api/settlement-accounts/settlement-account.dto';

@ApiTags('reserve-accounts')
@Controller('reserve-accounts')
@UseGuards(PermissionsGuard)
export class ReserveAccountController {
    constructor(private service: ReserveAccountService) {}

    @ApiOperation({ summary: 'Create Reserve Account' })
    @Permission(Permissions.ReserveAccountsCreate)
    @Post('/')
    public async create(@CurrentUser() user: JWTUser, @Body() body: CreateReserveAccountDto, @Req() req: Request) {
        return this.service.create(user.userId, body, req);
    }

    @ApiOperation({ summary: 'Get All Reserve Accounts' })
    @Permission(Permissions.ReserveAccountsRead)
    @Get('/')
    public async get(@Query() query: any) {
        return this.service.repo.findByQuery(query);
    }

    @ApiOperation({ summary: 'Get One Reserve Account' })
    @ApiParam({ name: 'id', description: 'Reserve Account ID', type: String })
    @Permission(Permissions.ReserveAccountsRead)
    @Get('/:id')
    public async getOne(@Param() param: ParamTagIdDto, @Query() query: any) {
        return this.service.repo.findById(param.id, query);
    }

    @ApiOperation({ summary: 'Get Reserve Balance' })
    @ApiParam({ name: 'id', description: 'Reserve Account ID', type: String })
    @Permission(Permissions.ReserveAccountsReadBalance)
    @Get('/:id/balance')
    public async getBalance(@Param() param: ParamTagIdDto, @Query() query: any) {
        return this.service.fetchBalance(param.id, query);
    }

    @ApiOperation({ summary: 'Debit Reserve Balance' })
    @ApiParam({ name: 'id', description: 'Reserve Account ID', type: String })
    @Permission(Permissions.ReserveAccountsDebit)
    @Post('/:id/balance/debit')
    public async debitBalance(
        @CurrentUser() user: JWTUser,
        @Param() param: ParamTagIdDto,
        @Body() body: DebitReserveAccountDto,
        @Req() req: Request,
    ) {
        return this.service.debitBalance(user.userId, param.id, body, req);
    }

    @ApiOperation({ summary: 'Credit Reserve Balance' })
    @ApiParam({ name: 'id', description: 'Reserve Account ID', type: String })
    @Permission(Permissions.ReserveAccountsCredit)
    @Post('/:id/balance/credit')
    public async creditBalance(
        @CurrentUser() user: JWTUser,
        @Param() param: ParamTagIdDto,
        @Body() body: DebitReserveAccountDto,
        @Req() req: Request,
    ) {
        return this.service.creditBalance(user.userId, param.id, body, req);
    }

    @ApiOperation({ summary: 'Add Deposit Channel' })
    @ApiParam({ name: 'id', description: 'Reserve Account ID', type: String })
    @Permission(Permissions.AccountsUpdateDepositChannel)
    @Post('/:id/deposit-channels')
    @HttpCode(HttpStatus.OK)
    public addDepositChannel(
        @CurrentUser() user: JWTUser,
        @Body() body: AddDepositChannelDto,
        @Query() query: APIPagingDto,
        @Param() param: ParamTagIdDto,
        @Req() req: Request,
    ) {
        return this.service.addDepositChannels(user.userId, param.id, body, req, query);
    }

    @ApiOperation({ summary: 'Transfer To Settlement Account' })
    @ApiParam({ name: 'id', description: 'Reserve Account ID', type: String })
    @Permission(Permissions.ReserveSettlementAccountsTransfer)
    @Post('/:id/settlement-account-transfer')
    public async transferToSettlementAccount(
        @CurrentUser() user: JWTUser,
        @Param() params: ParamTagIdDto,
        @Body() body: TransferSettlementAccountDto,
        @Req() req: Request,
        @Query() query: APIPagingDto,
    ) {
        return this.service.transferToSettlementAccount(user.userId, params.id, body, req, query);
    }
}

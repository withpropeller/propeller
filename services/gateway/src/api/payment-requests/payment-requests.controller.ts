import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Permission } from '@common/decorators';
import { Permissions } from '@api/roles';
import { Response } from 'express'
import { JWTUser } from '@auth/jwt.strategy';
import { PaymentRequestService } from './payment-requests.service';

@ApiTags('payment-requests')
@Controller('payment-requests')
export class PaymentRequestController {
    constructor(
        private service: PaymentRequestService) { }

    @ApiOperation({ summary: 'Get Payment Requests' })
    @Get()
    @Permission(Permissions.PaymentRequestRead)
    public async getAll(@Res() res: Response, @CurrentUser() user: JWTUser, @Query() query: any) {
        const response = await this.service.get(user, query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get One Payment Request' })
    @Permission(Permissions.PaymentRequestRead)
    @Get('/:id')
    public async get(
        @CurrentUser() user: JWTUser, 
        @Param() param: any, 
        @Query() query: any,
        @Res() res: Response,
        ) {
        const response = await this.service.getOne(user, param.id, query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Create Payment Request' })
    @Permission(Permissions.PaymentRequestCreate)
    @Post()
    public async create(
        @CurrentUser() user: JWTUser, @Body() body: any, @Res() res: Response,
        ) {
        const response = await this.service.post(user, '/', body);
        res.status(response.status).send(response.data);
    }

}

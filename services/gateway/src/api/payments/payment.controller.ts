import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Permission } from '@common/decorators';
import { APIPagingDto } from '@common/api-paging';
import { Permissions } from '@api/roles';
import { Response } from 'express';
import { JWTUser } from '@auth/jwt.strategy';
import { PaymentService } from './payment.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
    constructor(private service: PaymentService) {}

    @ApiOperation({ summary: 'Get Payments' })
    @Get()
    @Permission(Permissions.PaymentRead)
    public async getAll(@Res() res: Response, @CurrentUser() user: JWTUser, @Query() query: APIPagingDto) {
        const response = await this.service.get(user, query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get One Payment' })
    @Permission(Permissions.PaymentRead)
    @Get('/:id')
    public async getOne(@CurrentUser() user: JWTUser, @Param() param: any, @Query() query: any, @Res() res: Response) {
        const response = await this.service.getOne(user, param.id, query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Create Payment Payout' })
    @Permission(Permissions.PaymentCreatePayout)
    @Post('/payout')
    public async create(@CurrentUser() user: JWTUser, @Body() body: any, @Res() res: Response) {
        const response = await this.service.postAction(user, 'payout', body);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Generate Payment Receipt PDF' })
    @Permission(Permissions.PaymentRead)
    @Get('/:id/generate/pdf')
    public async generatePdf(
        @CurrentUser() user: JWTUser,
        @Param() param: any,
        @Query() query: any,
        @Res() res: Response,
    ) {
        const response = await this.service.getIdActionStream(user, param.id, 'generate/pdf', query);
        const stream = response.data as any;

        stream.pipe(res);
    }
}

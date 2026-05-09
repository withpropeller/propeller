import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { APIPagingDto } from '@common/api-paging';
import { CurrentUser, Permission } from '@common/decorators';
import { Permissions } from '@api/roles';
import { ParamTagIdDto } from '@common/dtos';
import { CreatePayoutPaymentDto } from './reserve-payment.dto';
import { JWTUser } from '@auth/jwt.strategy';
import { Request } from 'express';
import { ReservePaymentService } from './reserve-payment.service';

@ApiTags('reserve-payments')
@Controller('reserve-payments')
export class ReservePaymentController {
    constructor(private service: ReservePaymentService) {}

    @ApiOperation({ summary: 'Get Payments' })
    @Get()
    @Permission(Permissions.PaymentRead)
    public async get(@Query() query: APIPagingDto) {
        return this.service.repo.findByQuery(query);
    }

    @ApiOperation({ summary: 'Get One Payment' })
    @ApiParam({ name: 'id', description: 'Reserve Payment ID', type: String })
    @Get('/:id')
    @Permission(Permissions.PaymentRead)
    public async getOne(@Query() query: APIPagingDto, @Param() param: ParamTagIdDto) {
        return this.service.repo.findOneAndPopulate({ _id: param.id }, query.expand);
    }

    @ApiOperation({ summary: 'Create Payment Payout' })
    @Post('payout')
    @Permission(Permissions.PaymentCreatePayout)
    public async create(
        @CurrentUser() user: JWTUser,
        @Req() req: Request,
        @Query() query: APIPagingDto,
        @Body() body: CreatePayoutPaymentDto,
    ) {
        return this.service.create(user.userId, body, query, req);
    }

    @ApiOperation({ summary: 'Create Payment Requeue' })
    @ApiParam({ name: 'id', description: 'Reserve Payment ID', type: String })
    @Post('/:id/requeue')
    @Permission(Permissions.PaymentRequeue)
    public async repush(
        @CurrentUser() user: JWTUser,
        @Req() req: Request,
        @Param() param: ParamTagIdDto,
        @Query() query: APIPagingDto,
    ) {
        return this.service.requeue(user.userId, param.id, query, req);
    }

    @ApiOperation({ summary: 'Get Final Status Data' })
    @ApiParam({ name: 'id', description: 'Reserve Payment ID', type: String })
    @Get('/:id/processor-status')
    @Permission(Permissions.PaymentRead)
    public async fetchProcessorStatus(@Param() param: ParamTagIdDto) {
        return this.service.fetchProcessorStatus(param.id);
    }

    @ApiOperation({ summary: 'Validate Payment' })
    @ApiParam({ name: 'id', description: 'Reserve Payment ID', type: String })
    @Post('/:id/validate')
    @Permission(Permissions.PaymentValidate)
    public async validate(
        @CurrentUser() user: JWTUser,
        @Req() req: Request,
        @Param() param: ParamTagIdDto,
        @Query() query: APIPagingDto,
    ) {
        return this.service.validate(user.userId, param.id, query, req);
    }
}

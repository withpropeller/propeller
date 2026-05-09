import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { APIPagingDto } from '@common/api-paging';
import {
    CurrentUser,
    Permission,
    ApiResponseWrapper,
    ApiResponseListWrapper,
    ApiBasicResponse,
    ApiCommonResponse,
} from '@common/decorators';
import { Permissions } from '@api/roles';
import { ParamTagIdDto, MetricsQueryDto } from '@common/dtos';
import { ForceChargeDto, RefundPaymentDto, UpdateProcessorDataDto, PaymentMetricsDto } from './payment.dto';
import { PaymentService } from './payment.service';
import { JWTUser } from '@auth/jwt.strategy';
import { Request } from 'express';
import { ApiHydratedPayment } from './payment.schema';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
    constructor(private service: PaymentService) {}

    @ApiOperation({ summary: 'Get Payments' })
    @ApiBearerAuth()
    @Get()
    @Permission(Permissions.PaymentRead)
    @HttpCode(HttpStatus.OK)
    @ApiResponseListWrapper(ApiHydratedPayment, 200, 'Payments retrieved successfully')
    @ApiCommonResponse()
    public async get(@Query() query: APIPagingDto) {
        return this.service.getAll(query);
    }

    @ApiOperation({ summary: 'Get Payment Metrics' })
    @ApiBearerAuth()
    @Get('metrics')
    @Permission(Permissions.PaymentRead)
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(PaymentMetricsDto, 200, 'Payment metrics retrieved successfully')
    @ApiCommonResponse()
    public async getMetrics(@Query() query: MetricsQueryDto) {
        return this.service.getMetrics(query);
    }

    @ApiOperation({ summary: 'Get One Payment' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Payment ID', type: String })
    @Get('/:id')
    @Permission(Permissions.PaymentRead)
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedPayment, 200, 'Payment retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Payment not found')
    public async getOne(@Query() query: APIPagingDto, @Param() param: ParamTagIdDto) {
        return this.service.getOne(param.id, query);
    }

    @ApiOperation({ summary: 'Force Charge Payment' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Payment ID', type: String })
    @Post('/:id/charge/force')
    @Permission(Permissions.PaymentCreateChargeForce)
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Force charge initiated successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Payment not found')
    public async forceCharge(
        @CurrentUser() user: JWTUser,
        @Req() req: Request,
        @Body() body: ForceChargeDto,
        @Query() query: APIPagingDto,
        @Param() param: ParamTagIdDto,
    ) {
        return this.service.forceCharge(user.userId, param.id, body, query, req);
    }

    @ApiOperation({ summary: 'Requeue Payment' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Payment ID', type: String })
    @Post('/:id/requeue')
    @Permission(Permissions.PaymentRequeue)
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Payment requeued successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Payment not found')
    public async repush(
        @CurrentUser() user: JWTUser,
        @Req() req: Request,
        @Param() param: ParamTagIdDto,
        @Query() query: APIPagingDto,
    ) {
        return this.service.requeue(user.userId, param.id, query, req);
    }

    @ApiOperation({ summary: 'Get Payment Processor Status' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Payment ID', type: String })
    @Get('/:id/processor-status')
    @Permission(Permissions.PaymentRead)
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Processor status retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Payment not found')
    public async fetchProcessorStatus(@Param() param: ParamTagIdDto) {
        return this.service.fetchProcessorStatus(param.id);
    }

    @ApiOperation({ summary: 'Update Payment Processor Data' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Payment ID', type: String })
    @Put('/:id/processor-data')
    @Permission(Permissions.PaymentUpdateProcessorData)
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedPayment, 200, 'Processor data updated successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Payment not found')
    public async markAsProcessorNotFound(
        @CurrentUser() user: JWTUser,
        @Req() req: Request,
        @Body() body: UpdateProcessorDataDto,
        @Param() param: ParamTagIdDto,
        @Query() query: APIPagingDto,
    ) {
        return this.service.updateProcessorData(user.userId, param.id, body, req, query);
    }

    @ApiOperation({ summary: 'Create Payin Refund' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Payment ID', type: String })
    @Post('/:id/payin/refund')
    @Permission(Permissions.PaymentCreatePayInRefund)
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Refund initiated successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Payment not found')
    public async refund(
        @CurrentUser() user: JWTUser,
        @Req() req: Request,
        @Body() body: RefundPaymentDto,
        @Query() query: APIPagingDto,
        @Param() param: ParamTagIdDto,
    ) {
        return this.service.payinRefund(user.userId, param.id, body, query, req);
    }
}

import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
    ApiBasicResponse,
    ApiCommonResponse,
    ApiResponseListWrapper,
    ApiResponseWrapper,
    CurrentUser,
    Permission,
} from '@common/decorators';
import { APIPagingDto } from '@common/api-paging';
import { Permissions } from '@api/roles';
import { Response } from 'express';
import { JWTUser } from '@auth/jwt.strategy';
import { PaymentService } from './payment.service';
import { ApiHydratedPayment } from './payment.schema';
import { CreatePayoutPaymentDto } from './payment.dto';

@ApiBearerAuth()
@ApiTags('payments')
@Controller('payments')
export class PaymentController {
    constructor(private service: PaymentService) {}

    @ApiOperation({ summary: 'Get All Payments' })
    @Permission(Permissions.PaymentRead)
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiResponseListWrapper(ApiHydratedPayment, 200, 'Payments retrieved successfully')
    @ApiCommonResponse()
    public async getAll(@Res() res: Response, @CurrentUser() user: JWTUser, @Query() query: APIPagingDto) {
        const response = await this.service.get(user, query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get One Payment' })
    @Permission(Permissions.PaymentRead)
    @ApiParam({ name: 'id', description: 'Payment ID', type: String })
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedPayment, 200, 'Payment retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Payment not found')
    public async getOne(@CurrentUser() user: JWTUser, @Param() param: any, @Query() query: any, @Res() res: Response) {
        const response = await this.service.getOne(user, param.id, query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Create Payment Payout' })
    @Permission(Permissions.PaymentCreatePayout)
    @Post('/payout')
    @HttpCode(HttpStatus.CREATED)
    @ApiResponseWrapper(ApiHydratedPayment, 201, 'Payment payout created successfully')
    @ApiCommonResponse()
    public async create(@CurrentUser() user: JWTUser, @Body() body: CreatePayoutPaymentDto, @Res() res: Response) {
        const response = await this.service.postAction(user, 'payout', body);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Generate Payment Receipt PDF' })
    @Permission(Permissions.PaymentRead)
    @ApiParam({ name: 'id', description: 'Payment ID', type: String })
    @Get('/:id/generate/pdf')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Payment receipt PDF generated successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Payment not found')
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

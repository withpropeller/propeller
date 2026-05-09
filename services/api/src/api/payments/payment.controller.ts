import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SecretKeyPermissions as Permissions } from '@api/secret-keys';
import { APIPagingDto } from '@common/api-paging';
import { CurrentAccessKey, Permission } from '@common/decorators';
import { ParamIdDto } from '@common/dtos';
import { AccessKey } from '@core/interfaces';
import { CreatePayoutPaymentDto, GeneratePDFDto } from './payment.dto';
import { PaymentService } from './payment.service';
import { PayoutPaymentService } from './payout.payment.service';
import { Response } from 'express';
import { CreateBillPaymentDto } from './bill-payment.dto';
import { BillPaymentService } from './bill-payment.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
    constructor(
        private service: PaymentService,
        private payoutPaymentService: PayoutPaymentService,
        private billPaymentService: BillPaymentService,
    ) {}

    @ApiOperation({ summary: 'Get Payments' })
    @Get()
    @Permission(Permissions.PaymentRead)
    public async get(@CurrentAccessKey() key: AccessKey, @Query() query: APIPagingDto) {
        return this.service.repo.findByQuery(query, { business: key.businessId });
    }

    @ApiOperation({ summary: 'Get One Payment' })
    @Get('/:id')
    @Permission(Permissions.PaymentRead)
    public async getOne(@CurrentAccessKey() key: AccessKey, @Query() query: APIPagingDto, @Param() param: ParamIdDto) {
        return this.service.findByIdOrReference(key.businessId, param.id, query);
    }

    @ApiOperation({ summary: 'Resend Payment Events' })
    @Post('/:id/resend-events/payment-completed')
    @Permission(Permissions.PaymentRead)
    public async resendEvents(
        @CurrentAccessKey() key: AccessKey,
        @Query() query: APIPagingDto,
        @Param() param: ParamIdDto,
    ) {
        return this.service.resendPaymentCompletedEvent(key.businessId, param.id, query);
    }

    @ApiOperation({ summary: 'Requeue Payment' })
    @Post('/:id/requeue')
    @Permission(Permissions.PaymentRequeue)
    public async requeue(@CurrentAccessKey() key: AccessKey, @Query() query: APIPagingDto, @Param() param: ParamIdDto) {
        return this.service.requeue(key.businessId, param.id, query);
    }

    @ApiOperation({ summary: 'Create Payment Payout' })
    @Post('payout')
    @Permission(Permissions.PaymentCreatePayout)
    public async create(
        @CurrentAccessKey() key: AccessKey,
        @Query() query: APIPagingDto,
        @Body() body: CreatePayoutPaymentDto,
    ) {
        return this.payoutPaymentService.create(body, key, query);
    }

    @ApiOperation({ summary: 'Create Bill Payment' })
    @Post('bill')
    @Permission(Permissions.PaymentCreateBill)
    public async createBillPayment(
        @CurrentAccessKey() key: AccessKey,
        @Query() query: APIPagingDto,
        @Body() body: CreateBillPaymentDto,
    ) {
        return this.billPaymentService.create(body, key, query);
    }

    @ApiOperation({ summary: 'Validate Bill Payment' })
    @Post('/bill/validate')
    @Permission(Permissions.PaymentBillValidate)
    public async validateBillProduct(@CurrentAccessKey() key: AccessKey, @Body() body: CreateBillPaymentDto) {
        return this.billPaymentService.validate(body, key);
    }

    @ApiOperation({ summary: 'Generate Payment Receipt PDF' })
    @Permission(Permissions.PaymentRead)
    @Get('/:id/generate/pdf')
    public async generatePDF(
        @CurrentAccessKey() key: AccessKey,
        @Param() param: ParamIdDto,
        @Query() query: GeneratePDFDto,
        @Res() res: Response,
    ) {
        const [pdfStream, fileName] = await this.service.generatePDF(key.businessId, param.id, query.timezone);

        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Length': Buffer.byteLength(pdfStream),
            'Content-Disposition': `attachment; filename="${fileName}"`,
        });
        res.write(pdfStream);
        res.end();
    }
}

import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SecretKeyPermissions as Permissions } from '@api/secret-keys';
import { APIPagingDto } from '@common/api-paging';
import { CurrentAccessKey, Permission } from '@common/decorators';
import { AccessKey } from '@core/interfaces';
import { PaymentRequestService } from './payment-request.service';
import { ICreatePaymentRequestDto } from './payment-request.dto';
import { ParamIdDto } from '@common/dtos';
import { CustomFnValidationPipe } from '@core/pipes/param-validation.pipe';
import { validateCreatePaymentRequest } from './payment.utils';

@ApiTags('payment-requests')
@Controller('payment-requests')
export class PaymentRequestController {
    constructor(private service: PaymentRequestService) {}

    @ApiOperation({ summary: 'Get Payment Request' })
    @Get()
    @Permission(Permissions.PaymentRequestRead)
    public async get(@CurrentAccessKey() key: AccessKey, @Query() query: APIPagingDto) {
        return this.service.repo.findByQuery(query, {
            business: key.businessId,
        });
    }

    @ApiOperation({ summary: 'Create Payment Request' })
    @Post()
    @Permission(Permissions.PaymentRequestCreate)
    public async create(
        @CurrentAccessKey() key: AccessKey,
        @Body(new CustomFnValidationPipe(validateCreatePaymentRequest)) body: ICreatePaymentRequestDto,
        @Query() query: APIPagingDto,
    ) {
        return this.service.createPaymentRequest(body, key, query);
    }

    @ApiOperation({ summary: 'Get One Payment Request' })
    @Get('/:id')
    @Permission(Permissions.PaymentRequestRead)
    public async getOne(@CurrentAccessKey() key: AccessKey, @Query() query: APIPagingDto, @Param() param: ParamIdDto) {
        return this.service.findByIdOrReference(key.businessId, param.id, query);
    }
}

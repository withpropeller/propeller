import { CurrentAccessKey, Permission } from '@common/decorators';
import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { APIPagingDto } from '@common/api-paging';
import { CustomerDto, PatchCustomerDto } from './customer.dto';
import { SecretKeyPermissions as Permissions } from '@api/secret-keys';
import { AccessKey } from '@core/interfaces';
import { ParamIdDto } from '@common/dtos';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomerController {
    constructor(private service: CustomerService) {}

    @ApiOperation({ summary: 'Create Customer' })
    @Permission(Permissions.CustomerCreate)
    @Post('/')
    public async create(@Query() query: APIPagingDto, @Body() body: CustomerDto, @CurrentAccessKey() key: AccessKey) {
        return this.service.create(key.businessId, body, query);
    }

    @ApiOperation({ summary: 'Get Customer' })
    @Permission(Permissions.CustomerRead)
    @Get('/')
    public async getCustomer(@Query() query: APIPagingDto, @CurrentAccessKey() key: AccessKey) {
        return this.service.repo.findByQuery(query, {
            business: key.businessId,
        });
    }

    @ApiOperation({ summary: 'Get Customer' })
    @Permission(Permissions.CustomerRead)
    @Get('/:id')
    public async getOne(@CurrentAccessKey() key: AccessKey, @Query() query: APIPagingDto, @Param() param: ParamIdDto) {
        return this.service.findByIdOrReference(key.businessId, param.id, query);
    }

    @ApiOperation({ summary: 'Update Customer' })
    @Permission(Permissions.CustomerUpdate)
    @Put('/:id')
    public async updateCustomer(
        @Query() query: APIPagingDto,
        @Body() body: PatchCustomerDto,
        @Param() param: ParamIdDto,
        @CurrentAccessKey() key: AccessKey,
    ) {
        return this.service.update(key.businessId, param.id, body, query);
    }
}

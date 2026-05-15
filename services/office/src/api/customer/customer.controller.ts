import {
    ApiBasicResponse,
    ApiCommonResponse,
    ApiResponseListWrapper,
    ApiResponseWrapper,
    Permission,
} from '@common/decorators';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { APIPagingDto } from '@common/api-paging';
import { PatchCustomerDto, CustomerMetricsDto } from './customer.dto';
import { MetricsQueryDto, ParamTagIdDto } from '@common/dtos';
import { Permissions } from '@api/roles';
import { ApiHydratedCustomer } from './customer.schema';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomerController {
    constructor(private service: CustomerService) {}

    @ApiOperation({ summary: 'Get Customers' })
    @Permission(Permissions.CustomersRead)
    @Get('/')
    @HttpCode(HttpStatus.OK)
    @ApiResponseListWrapper(ApiHydratedCustomer, 200, 'Customers retrieved successfully')
    @ApiCommonResponse()
    public async getCustomer(@Query() query: APIPagingDto) {
        return this.service.getAll(query);
    }

    @ApiOperation({ summary: 'Get Customer Metrics' })
    @Permission(Permissions.CustomersRead)
    @Get('/metrics')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(CustomerMetricsDto, 200, 'Customer metrics retrieved successfully')
    @ApiCommonResponse()
    public async getMetrics(@Query() query: MetricsQueryDto) {
        return this.service.getMetrics(query);
    }

    @ApiOperation({ summary: 'Get One Customer' })
    @ApiParam({ name: 'id', description: 'Customer ID', type: String })
    @Permission(Permissions.CustomersRead)
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedCustomer, 200, 'Customer retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Customer not found')
    public async getOne(@Query() query: APIPagingDto, @Param() param: ParamTagIdDto) {
        return this.service.getOne(param.id, query);
    }

    @ApiOperation({ summary: 'Update Customer', description: 'Update customer information. Only fields included in the request body will be updated.' })
    @ApiParam({ name: 'id', description: 'Customer ID', type: String })
    @Permission(Permissions.CustomersUpdate)
    @Put('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedCustomer, 200, 'Customer updated successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Customer not found')
    public async updateCustomer(
        @Query() query: APIPagingDto,
        @Body() body: PatchCustomerDto,
        @Param() param: ParamTagIdDto,
    ) {
        return this.service.repo.findOneAndUpdate({ _id: param.id }, body, query);
    }
}

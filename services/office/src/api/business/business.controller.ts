import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
    Permission,
    ApiResponseWrapper,
    ApiResponseListWrapper,
    ApiBasicResponse,
    ApiCommonResponse,
} from '@common/decorators';
import { Permissions } from '@api/roles';
import { APIPagingDto } from '@common/api-paging';
import { BusinessService } from './business.service';
import { PermissionsGuard } from '@auth/guards/permission.guard';
import { MetricsQueryDto, ParamTagIdDto } from '@common/dtos';
import { BusinessKYCService } from './business-kyc.service';
import { ApiHydratedBusiness } from './business.schema';
import { ApiHydratedBusinessKYC } from './business-kyc.schema';
import { BusinessMetricsDto } from './business.dto';

@ApiTags('business')
@Controller('business')
@UseGuards(PermissionsGuard)
export class BusinessController {
    constructor(private service: BusinessService, private kycService: BusinessKYCService) {}

    @ApiOperation({ summary: 'Get All Businesses' })
    @ApiBearerAuth()
    @Permission(Permissions.BusinessRead)
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiResponseListWrapper(ApiHydratedBusiness, 200, 'Businesses retrieved successfully')
    @ApiCommonResponse()
    public async findAll(@Query() query: APIPagingDto) {
        return this.service.findByQuery(query);
    }

    @ApiOperation({ summary: 'Get Business Metrics' })
    @ApiBearerAuth()
    @Permission(Permissions.BusinessRead)
    @Get('metrics')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(BusinessMetricsDto, 200, 'Business metrics retrieved successfully')
    @ApiCommonResponse()
    public async getMetrics(@Query() query: MetricsQueryDto) {
        return this.service.getMetrics(query);
    }

    @ApiOperation({ summary: 'Get One Business' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Business ID', type: String })
    @Permission(Permissions.BusinessRead)
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedBusiness, 200, 'Business retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Business not found')
    public async find(@Param() param: ParamTagIdDto, @Query() query: APIPagingDto) {
        return this.service.findOneAndPopulate({ _id: param.id }, query.expand);
    }

    @ApiOperation({ summary: 'Get Business Members' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Business ID', type: String })
    @Permission(Permissions.BusinessReadMembers)
    @Get(':id/members')
    @HttpCode(HttpStatus.OK)
    @ApiResponseListWrapper(ApiHydratedBusiness, 200, 'Business members retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Business not found')
    public async getBusiness(@Param() param: ParamTagIdDto, @Query() query: APIPagingDto) {
        return this.service.getBusinessMembers(param.id, query);
    }

    @ApiOperation({ summary: 'Get Business KYC' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Business KYC ID', type: String })
    @Get('/kyc/:id')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedBusinessKYC, 200, 'Business KYC retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Business KYC not found')
    getKyc(@Param() param: ParamTagIdDto) {
        return this.kycService.findById(param.id);
    }

    @ApiOperation({ summary: 'Initiate Business Sandbox' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Business ID', type: String })
    @Permission(Permissions.BusinessInitiateSandbox)
    @Post('/:id/initiate-sandbox')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Business sandbox initiated successfully')
    @ApiCommonResponse()
    initiateSandbox(@Param() param: ParamTagIdDto, @Query() query: APIPagingDto) {
        return this.service.initiateSandbox(param.id, query);
    }
}

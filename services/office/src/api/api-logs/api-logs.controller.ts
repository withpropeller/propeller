import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
    ApiBasicResponse,
    ApiCommonResponse,
    ApiResponseListWrapper,
    ApiResponseWrapper,
    Permission,
} from '@common/decorators';
import { ApiLogsService } from './api-logs.service';
import { Permissions } from '@api/roles';
import { APIPagingDto } from '@common/api-paging';
import { MetricsQueryDto, ParamTagIdDto } from '@common/dtos';
import { RequestRetryDto } from './api-requests.dto';
import { ApiHydratedApiRequest } from './api-log.schema';
import { ApiLogsMetricsDto } from './api-logs.dto';

@ApiTags('logs')
@ApiBearerAuth()
@Controller('logs')
export class ApiLogsController {
    constructor(private service: ApiLogsService) {}

    @ApiOperation({ summary: 'Get Api Calls' })
    @Permission(Permissions.ApiLogsRead)
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiResponseListWrapper(ApiHydratedApiRequest, 200, 'API calls retrieved successfully')
    @ApiCommonResponse()
    public async get(@Query() query: APIPagingDto) {
        return this.service.getAll(query);
    }

    @ApiOperation({ summary: 'Get Api Call Metrics' })
    @Permission(Permissions.ApiLogsRead)
    @Get('/metrics')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiLogsMetricsDto, 200, 'API call metrics retrieved successfully')
    @ApiCommonResponse()
    public async getMetrics(@Query() query: MetricsQueryDto) {
        return this.service.getMetrics(query);
    }

    @ApiOperation({ summary: 'Get One Api Call' })
    @ApiParam({ name: 'id', description: 'Log ID', type: String })
    @Permission(Permissions.ApiLogsRead)
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedApiRequest, 200, 'API call retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'API log not found')
    public async getOne(@Param() param: ParamTagIdDto, @Query() query: APIPagingDto) {
        return this.service.getOne(param.id, query);
    }

    @ApiOperation({ summary: 'Retry Api Request' })
    @ApiParam({ name: 'id', description: 'Log ID', type: String })
    @Permission(Permissions.ApiLogsRetry)
    @Post('/:id/retry')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'API request retry dispatched')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'API log not found')
    public async retry(@Param() param: ParamTagIdDto, @Body() body: RequestRetryDto) {
        return this.service.retry(param.id, body);
    }
}

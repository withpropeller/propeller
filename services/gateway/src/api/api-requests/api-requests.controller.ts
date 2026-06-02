import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiRequestsService } from './api-requests.service';
import { Permissions } from '@api/roles';
import {
    ApiCommonResponse,
    ApiBasicResponse,
    ApiResponseListWrapper,
    ApiResponseWrapper,
    CurrentUser,
    Permission,
} from '@common/decorators';
import { JWTUser } from '@auth/jwt.strategy';
import { APIPagingDto } from '@common/api-paging';
import { ParamTagIdDto } from '@common/dtos';
import { Param } from '@nestjs/common';
import { ApiHydratedApiRequest } from './api-request.schema';

@ApiBearerAuth()
@ApiTags('requests')
@Controller('requests')
export class ApiRequestsController {
    constructor(private service: ApiRequestsService) {}

    @ApiOperation({ summary: 'Get API Logs' })
    @Get()
    @HttpCode(HttpStatus.OK)
    @Permission(Permissions.ApiRequestsRead)
    @ApiResponseListWrapper(ApiHydratedApiRequest, 200, 'API logs retrieved successfully')
    @ApiCommonResponse()
    public async get(@CurrentUser() user: JWTUser, @Query() query: APIPagingDto) {
        return this.service.getAll(user, query);
    }

    @ApiOperation({ summary: 'Get One API Log' })
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    @Permission(Permissions.ApiRequestsRead)
    @ApiParam({ name: 'id', description: 'API log ID', type: String })
    @ApiResponseWrapper(ApiHydratedApiRequest, 200, 'API log retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'API log not found')
    public async getOne(@CurrentUser() user: JWTUser, @Param() param: ParamTagIdDto, @Query() query: APIPagingDto) {
        return this.service.getOne(param.id, user.businessId, query);
    }
}

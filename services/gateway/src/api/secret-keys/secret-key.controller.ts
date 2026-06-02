import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
    ApiBasicResponse,
    ApiCommonResponse,
    ApiResponseListWrapper,
    ApiResponseWrapper,
    CurrentUser,
    Permission,
} from '@common/decorators';
import { Permissions } from '@api/roles';
import {
    CreateSecretKeyDto,
    PatchSecretKeyDto,
    SecretKeyMetricsDto,
    SecretKeyMetricsResponseDto,
} from './secret-key.dto';
import { SecretKeyService } from './secret-key.service';
import { JWTUser } from '@auth/jwt.strategy';
import { APIPagingDto } from '@common/api-paging';
import { ParamIdDto, ParamMongoIdDto } from '@common/dtos';
import { Request } from 'express';
import { ApiHydratedSecretKey } from './secret-key.schema';

@ApiBearerAuth()
@ApiTags('secret-keys')
@Controller('secret-keys')
export class SecretKeyController {
    constructor(private service: SecretKeyService) {}

    @ApiOperation({ summary: 'Get Project Access Keys ' })
    @Get()
    @HttpCode(HttpStatus.OK)
    @Permission(Permissions.SecretKeyRead)
    @ApiResponseListWrapper(ApiHydratedSecretKey, 200, 'Secret keys retrieved successfully')
    @ApiCommonResponse()
    public async getAll(@CurrentUser() user: JWTUser, @Query() query: APIPagingDto) {
        return await this.service.repo.findByQuery(query, { business: user.businessId });
    }

    @ApiOperation({ summary: 'Get Secret Key Metrics' })
    @Get('/:id/metrics')
    @HttpCode(HttpStatus.OK)
    @Permission(Permissions.SecretKeyRead)
    @ApiParam({ name: 'id', description: 'Secret key ID', type: String })
    @ApiResponseWrapper(SecretKeyMetricsResponseDto, 200, 'Secret key metrics retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Secret key not found')
    public async getMetrics(
        @CurrentUser() user: JWTUser,
        @Param() param: ParamMongoIdDto,
        @Query() query: SecretKeyMetricsDto,
    ) {
        return await this.service.getMetrics(user, param.id, query);
    }

    @ApiOperation({ summary: 'Get One Project Access Keys ' })
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    @Permission(Permissions.SecretKeyRead)
    @ApiParam({ name: 'id', description: 'Secret key ID', type: String })
    @ApiResponseWrapper(ApiHydratedSecretKey, 200, 'Secret key retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Secret key not found')
    public async getOne(@CurrentUser() user: JWTUser, @Param() param: ParamIdDto, @Query() query: APIPagingDto) {
        return await this.service.repo.findOneWithOptions({
            conditions: { _id: param.id, business: user.businessId },
            select: query.select,
        });
    }

    @ApiOperation({ summary: 'Create Access Key' })
    @Permission(Permissions.SecretKeyCreate)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiResponseWrapper(ApiHydratedSecretKey, 201, 'Secret key created successfully')
    @ApiCommonResponse()
    public async create(@CurrentUser() user: JWTUser, @Body() body: CreateSecretKeyDto, @Req() req: Request) {
        return await this.service.create(user, body, req);
    }

    @ApiOperation({ summary: 'Update Access Key' })
    @Permission(Permissions.SecretKeyUpdate)
    @Put('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiParam({ name: 'id', description: 'Secret key ID', type: String })
    @ApiResponseWrapper(ApiHydratedSecretKey, 200, 'Secret key updated successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Secret key not found')
    public async put(
        @CurrentUser() user: JWTUser,
        @Param() param: ParamMongoIdDto,
        @Body() body: PatchSecretKeyDto,
        @Req() req: Request,
    ) {
        return await this.service.update(user, param.id, body, req);
    }

    @ApiOperation({ summary: 'Delete Access Key' })
    @Permission(Permissions.SecretKeyDelete)
    @Delete('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiParam({ name: 'id', description: 'Secret key ID', type: String })
    @ApiBasicResponse(200, 'Secret key deleted successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Secret key not found')
    public async delete(@CurrentUser() user: JWTUser, @Param() param: ParamMongoIdDto, @Req() req: Request) {
        return this.service.delete(param.id, user, req);
    }
}

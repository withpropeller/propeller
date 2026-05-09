import { Controller, Get, Query, Param, Post } from '@nestjs/common';
import { CurrentAccessKey, Permission } from '@common/decorators';
import { APIPagingDto } from '@common/api-paging';
import { ParamTagIdDto } from '@common/dtos';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiLogsService } from './api-logs.service';
import { SecretKeyPermissions as Permissions } from '@api/secret-keys';
import { AccessKey } from '@core/interfaces';

@ApiTags('requests')
@Controller('requests')
export class ApiLogsController {
    constructor(private service: ApiLogsService) {}

    @ApiOperation({ summary: 'Get All Requests' })
    @Get()
    @Permission(Permissions.RequestsRead)
    public async get(@CurrentAccessKey() key: AccessKey, @Query() query: APIPagingDto) {
        return this.service.repo.findByQuery(query, {
            business: key.businessId,
        });
    }

    @ApiOperation({ summary: 'Get One Requests' })
    @Get('/:id')
    @Permission(Permissions.RequestsRead)
    public async getOne(
        @CurrentAccessKey() key: AccessKey,
        @Param() param: ParamTagIdDto,
        @Query() query: APIPagingDto,
    ) {
        return this.service.repo.findOneWithOptions({
            conditions: { _id: param.id, business: key.businessId },
            expand: query.expand,
        });
    }
}

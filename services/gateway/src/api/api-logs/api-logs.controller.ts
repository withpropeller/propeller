import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiLogsService } from './api-logs.service';
import { Permissions } from '@api/roles';
import { CurrentUser, Permission } from '@common/decorators';
import { JWTUser } from '@auth/jwt.strategy';
import { APIPagingDto } from '@common/api-paging';
import { ParamTagIdDto } from '@common/dtos';
import { Param } from '@nestjs/common';

@ApiTags('logs')
@Controller('logs')
export class ApiLogsController {
    constructor(private service: ApiLogsService) {}

    @ApiOperation({ summary: 'Get Api Calls' })
    @Get()
    @Permission(Permissions.ApiLogsRead)
    public async get(@CurrentUser() user: JWTUser, @Query() query: APIPagingDto) {
        return this.service.getAll(user, query);
    }

    @ApiOperation({ summary: 'Get One Api Call' })
    @Get('/:id')
    @Permission(Permissions.ApiLogsRead)
    public async getOne(@CurrentUser() user: JWTUser, @Param() param: ParamTagIdDto, @Query() query: APIPagingDto) {
        return this.service.getOne(param.id, user.businessId, query);
    }
}

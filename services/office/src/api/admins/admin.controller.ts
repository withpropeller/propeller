import { Permission } from '@common/decorators';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { APIPagingDto } from '@common/api-paging';
import { ParamTagIdDto } from '@common/dtos';
import { Permissions } from '@api/roles';
import { AdminService } from './admin.service';

@ApiTags('admins')
@ApiBearerAuth()
@Controller('admins')
export class AdminsController {
    constructor(private service: AdminService) {}

    @ApiOperation({ summary: 'Get Admin' })
    @Permission(Permissions.AdminRead)
    @Get('/')
    public async getAll(@Query() query: APIPagingDto) {
        return this.service.findByQuery(query);
    }

    @ApiOperation({ summary: 'Get Admin' })
    @ApiParam({ name: 'id', description: 'Admin ID', type: String })
    @Permission(Permissions.AdminRead)
    @Get('/:id')
    public async getOne(@Query() query: APIPagingDto, @Param() param: ParamTagIdDto) {
        return this.service.findOneAndPopulate(param.id, query.expand);
    }
}

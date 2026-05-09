import { Permission } from '@common/decorators';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { APIPagingDto } from '@common/api-paging';
import { ParamTagIdDto } from '@common/dtos';
import { Permissions } from '@api/roles';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private service: UsersService) {}

    @ApiOperation({ summary: 'Get User' })
    @Permission(Permissions.UsersRead)
    @Get('/')
    public async getAll(@Query() query: APIPagingDto) {
        return this.service.findByQuery(query);
    }

    @ApiOperation({ summary: 'Get User' })
    @ApiParam({ name: 'id', description: 'User ID', type: String })
    @Permission(Permissions.UsersRead)
    @Get('/:id')
    public async getOne(@Query() query: APIPagingDto, @Param() param: ParamTagIdDto) {
        return this.service.findOneAndPopulate(param.id, query.expand);
    }
}

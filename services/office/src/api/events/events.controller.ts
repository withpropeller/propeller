import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { APIPagingDto } from '@common/api-paging';
import { Permission } from '@common/decorators';
import { ParamTagIdDto } from '@common/dtos';
import { EventService } from './events.service';
import { Permissions } from '@api/roles';

@ApiTags('events')
@Controller('events')
export class EventsController {
    constructor(private service: EventService) {}

    @ApiOperation({ summary: 'Get Events' })
    @Get()
    @Permission(Permissions.EventsRead)
    public async get(@Query() query: APIPagingDto) {
        return this.service.getAll(query);
    }

    @ApiOperation({ summary: 'Get One Event' })
    @ApiParam({ name: 'id', description: 'Event ID', type: String })
    @Get('/:id')
    @Permission(Permissions.EventsRead)
    public async getOne(@Query() query: APIPagingDto, @Param() param: ParamTagIdDto) {
        return this.service.getOne(param.id, query);
    }
}

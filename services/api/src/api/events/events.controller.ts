import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SecretKeyPermissions as Permissions } from '@api/secret-keys';
import { APIPagingDto } from '@common/api-paging';
import { CurrentAccessKey, Permission } from '@common/decorators';
import { ParamTagIdDto } from '@common/dtos';
import { AccessKey } from '@core/interfaces';
import { EventService } from './events.service';

@ApiTags('events')
@Controller('events')
export class EventsController {
    constructor(private service: EventService) {}

    @ApiOperation({ summary: 'Get Events' })
    @Get()
    @Permission(Permissions.EventRead)
    public async get(@CurrentAccessKey() key: AccessKey, @Query() query: APIPagingDto) {
        return this.service.repo.findByQuery(query, {
            business: key.businessId,
        });
    }

    @ApiOperation({ summary: 'Get One Event' })
    @Get('/:id')
    @Permission(Permissions.EventRead)
    public async getOne(
        @CurrentAccessKey() key: AccessKey,
        @Query() query: APIPagingDto,
        @Param() param: ParamTagIdDto,
    ) {
        return this.service.repo.findOneAndPopulate({ business: key.businessId, _id: param.id }, query.expand);
    }

    @ApiOperation({ summary: 'Retry Event' })
    @Post('/:id/retry')
    @Permission(Permissions.EventUpdateRetry)
    public async retryEvent(@CurrentAccessKey() key: AccessKey, @Param() param: ParamTagIdDto) {
        return this.service.retryEvent(key, param.id);
    }
}

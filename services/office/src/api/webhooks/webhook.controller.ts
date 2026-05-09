import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { APIPagingDto } from '@common/api-paging';
import { WebhookService } from './webhooks.service';
import { Permission } from '@common/decorators';
import { ParamTagIdDto } from '@common/dtos';
import { Permissions } from '@api/roles';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
    constructor(private service: WebhookService) {}

    @ApiOperation({ summary: 'Get Webhooks' })
    @Get()
    @Permission(Permissions.WebhookRead)
    public async get(@Query() query: APIPagingDto) {
        return this.service.getAll(query);
    }

    @ApiOperation({ summary: 'Get One Webhook' })
    @ApiParam({ name: 'id', description: 'Webhook ID', type: String })
    @Get('/:id')
    @Permission(Permissions.WebhookRead)
    public async getOne(@Query() query: APIPagingDto, @Param() param: ParamTagIdDto) {
        return this.service.getOne(param.id, query);
    }
}

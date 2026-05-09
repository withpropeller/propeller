import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SecretKeyPermissions as Permissions } from '@api/secret-keys';
import { APIPagingDto } from '@common/api-paging';
import { PatchWebhookDto, RollSecretWebhookDto, WebhookDto } from './webhook.dto';
import { WebhookService } from './webhooks.service';
import { CurrentAccessKey, Permission } from '@common/decorators';
import { ParamTagIdDto } from '@common/dtos';
import { AccessKey } from '@core/interfaces';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
    constructor(private service: WebhookService) {}

    @ApiOperation({ summary: 'Get Webhooks' })
    @Get()
    @Permission(Permissions.WebhookRead)
    public async get(@CurrentAccessKey() key: AccessKey, @Query() query: APIPagingDto) {
        return this.service.repo.findByQuery(query, {
            business: key.businessId,
        });
    }

    @ApiOperation({ summary: 'Get One Webhook' })
    @Get('/:id')
    @Permission(Permissions.WebhookRead)
    public async getOne(@CurrentAccessKey() key: AccessKey, @Param() param: ParamTagIdDto) {
        return this.service.repo.findOne({
            business: key.businessId,
            _id: param.id,
        });
    }

    @ApiOperation({ summary: 'Get Webhook  Signing Secret' })
    @Get('/:id/secret')
    @Permission(Permissions.WebhookRead)
    public async getSigningSecret(@CurrentAccessKey() key: AccessKey, @Param() param: ParamTagIdDto) {
        return this.service.revealSecret(key.businessId, param.id);
    }

    @ApiOperation({ summary: 'Roll Webhook  Signing Secret' })
    @Post('/:id/secret/roll')
    @Permission(Permissions.WebhookUpdate)
    public async rollSigningSecret(
        @CurrentAccessKey() key: AccessKey,
        @Body() body: RollSecretWebhookDto,
        @Param() param: ParamTagIdDto,
    ) {
        return this.service.rollSecret(key.businessId, param.id, body);
    }

    @ApiOperation({ summary: 'Enable Webhook' })
    @Permission(Permissions.WebhookUpdate)
    @Post('/:id/enable')
    public enable(@CurrentAccessKey() key: AccessKey, @Param() param: ParamTagIdDto) {
        return this.service.updateDisabled(param.id, key.businessId, false);
    }

    @ApiOperation({ summary: 'Disable Webhook' })
    @Permission(Permissions.WebhookUpdate)
    @Post('/:id/disable')
    public disable(@CurrentAccessKey() key: AccessKey, @Param() param: ParamTagIdDto) {
        return this.service.updateDisabled(param.id, key.businessId, true);
    }

    @ApiOperation({ summary: 'Create Webhooks' })
    @Permission(Permissions.WebhookCreate)
    @Post()
    public create(@CurrentAccessKey() key: AccessKey, @Body() body: WebhookDto) {
        return this.service.create(body, key.businessId);
    }

    @ApiOperation({ summary: 'Update Webhook' })
    @Permission(Permissions.WebhookUpdate)
    @Put('/:id')
    public update(@CurrentAccessKey() key: AccessKey, @Body() body: PatchWebhookDto, @Param() param: ParamTagIdDto) {
        return this.service.update(param.id, body, key.businessId);
    }

    @ApiOperation({ summary: 'Delete Webhooks' })
    @Permission(Permissions.WebhookDelete)
    @Delete('/:id')
    public async delete(@CurrentAccessKey() key: AccessKey, @Param() param: ParamTagIdDto) {
        return this.service.delete(param.id, key.businessId);
    }
}

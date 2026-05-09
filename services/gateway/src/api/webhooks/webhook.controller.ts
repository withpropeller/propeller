import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Permission } from '@common/decorators';
import { Permissions } from '@api/roles';
import { JWTUser } from '@auth/jwt.strategy';
import { Response } from 'express';
import { WebhookService } from './webhooks.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
    constructor(private service: WebhookService) {}

    @ApiOperation({ summary: 'Get Webhooks' })
    @Get()
    @Permission(Permissions.WebhookRead)
    public async get(
        @Res() res: Response,
        @CurrentUser() user: JWTUser,
        @Query() query: any,
    ) {
        const response = await this.service.get(user, query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get One Webhook' })
    @Get('/:id')
    @Permission(Permissions.WebhookRead)
    public async getOne(
        @Res() res: Response,
        @CurrentUser() user: JWTUser,
        @Param() param: any,
        @Query() query: any,
    ) {
        const response = await this.service.getOne(user, param.id, query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get Webhook  Signing Secret' })
    @Get('/:id/secret')
    @Permission(Permissions.WebhookRead)
    public async getSigningSecret(
        @Res() res: Response,
        @CurrentUser() user: JWTUser,
        @Param() param: any,
    ) {
        const response = await this.service.getIdAction(
            user,
            param.id,
            'secret',
        );
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Roll Webhook  Signing Secret' })
    @Post('/:id/secret/roll')
    @Permission(Permissions.WebhookUpdate)
    public async rollSigningSecret(
        @Res() res: Response,
        @CurrentUser() user: JWTUser,
        @Body() body: any,
        @Param() param: any,
    ) {
        const response = await this.service.postIdAction(
            user,
            param.id,
            'secret/roll',
            body,
        );
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Enable Webhook' })
    @Permission(Permissions.WebhookUpdate)
    @Post('/:id/enable')
    public async enable(
        @Res() res: Response,
        @CurrentUser() user: JWTUser,
        @Param() param: any,
    ) {
        const response = await this.service.postIdAction(
            user,
            param.id,
            'enable',
        );
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Disable Webhook' })
    @Permission(Permissions.WebhookUpdate)
    @Post('/:id/disable')
    public async disable(
        @Res() res: Response,
        @CurrentUser() user: JWTUser,
        @Param() param: any,
    ) {
        const response = await this.service.postIdAction(
            user,
            param.id,
            'disable',
        );
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Create Webhooks' })
    @Permission(Permissions.WebhookCreate)
    @Post()
    public async create(
        @CurrentUser() user: JWTUser,
        @Body() body: any,
        @Res() res: Response,
    ) {
        const response = await this.service.create(user, body);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Update Webhooks' })
    @Permission(Permissions.WebhookCreate)
    @Put('/:id')
    public async update(
        @CurrentUser() user: JWTUser,
        @Param() param: any,
        @Body() body: any,
        @Res() res: Response,
    ) {
        const response = await this.service.put(user, param.id, body);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Delete Webhooks' })
    @Permission(Permissions.WebhookDelete)
    @Delete('/:id')
    public async delete(
        @CurrentUser() user: JWTUser,
        @Param() param: any,
        @Res() res: Response,
    ) {
        const response = await this.service.delete(user, param.id);
        res.status(response.status).send(response.data);
    }
}

import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiBasicResponse, ApiCommonResponse, CurrentUser, Permission } from '@common/decorators';
import { Permissions } from '@api/roles';
import { JWTUser } from '@auth/jwt.strategy';
import { Response } from 'express';
import { WebhookService } from './webhooks.service';

@ApiTags('webhooks')
@ApiBearerAuth()
@Controller('webhooks')
export class WebhookController {
    constructor(private service: WebhookService) {}

    @ApiOperation({ summary: 'Get Webhooks' })
    @Get()
    @HttpCode(HttpStatus.OK)
    @Permission(Permissions.WebhookRead)
    @ApiBasicResponse(200, 'Webhooks retrieved successfully')
    @ApiCommonResponse()
    public async get(@Res() res: Response, @CurrentUser() user: JWTUser, @Query() query: any) {
        const response = await this.service.get(user, query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get One Webhook' })
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    @Permission(Permissions.WebhookRead)
    @ApiParam({ name: 'id', description: 'Webhook ID', type: String })
    @ApiBasicResponse(200, 'Webhook retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Webhook not found')
    public async getOne(@Res() res: Response, @CurrentUser() user: JWTUser, @Param() param: any, @Query() query: any) {
        const response = await this.service.getOne(user, param.id, query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get Webhook Signing Secret' })
    @Get('/:id/secret')
    @HttpCode(HttpStatus.OK)
    @Permission(Permissions.WebhookRead)
    @ApiParam({ name: 'id', description: 'Webhook ID', type: String })
    @ApiBasicResponse(200, 'Webhook signing secret retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Webhook not found')
    public async getSigningSecret(@Res() res: Response, @CurrentUser() user: JWTUser, @Param() param: any) {
        const response = await this.service.getIdAction(user, param.id, 'secret');
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Roll Webhook Signing Secret' })
    @Post('/:id/secret/roll')
    @HttpCode(HttpStatus.OK)
    @Permission(Permissions.WebhookUpdate)
    @ApiParam({ name: 'id', description: 'Webhook ID', type: String })
    @ApiBasicResponse(200, 'Webhook signing secret rolled successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Webhook not found')
    public async rollSigningSecret(
        @Res() res: Response,
        @CurrentUser() user: JWTUser,
        @Body() body: any,
        @Param() param: any,
    ) {
        const response = await this.service.postIdAction(user, param.id, 'secret/roll', body);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Enable Webhook' })
    @Permission(Permissions.WebhookUpdate)
    @Post('/:id/enable')
    @HttpCode(HttpStatus.OK)
    @ApiParam({ name: 'id', description: 'Webhook ID', type: String })
    @ApiBasicResponse(200, 'Webhook enabled successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Webhook not found')
    public async enable(@Res() res: Response, @CurrentUser() user: JWTUser, @Param() param: any) {
        const response = await this.service.postIdAction(user, param.id, 'enable');
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Disable Webhook' })
    @Permission(Permissions.WebhookUpdate)
    @Post('/:id/disable')
    @HttpCode(HttpStatus.OK)
    @ApiParam({ name: 'id', description: 'Webhook ID', type: String })
    @ApiBasicResponse(200, 'Webhook disabled successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Webhook not found')
    public async disable(@Res() res: Response, @CurrentUser() user: JWTUser, @Param() param: any) {
        const response = await this.service.postIdAction(user, param.id, 'disable');
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Create Webhook' })
    @Permission(Permissions.WebhookCreate)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiBasicResponse(201, 'Webhook created successfully')
    @ApiCommonResponse()
    public async create(@CurrentUser() user: JWTUser, @Body() body: any, @Res() res: Response) {
        const response = await this.service.create(user, body);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Update Webhook' })
    @Permission(Permissions.WebhookCreate)
    @Put('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiParam({ name: 'id', description: 'Webhook ID', type: String })
    @ApiBasicResponse(200, 'Webhook updated successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Webhook not found')
    public async update(@CurrentUser() user: JWTUser, @Param() param: any, @Body() body: any, @Res() res: Response) {
        const response = await this.service.put(user, param.id, body);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Delete Webhook' })
    @Permission(Permissions.WebhookDelete)
    @Delete('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiParam({ name: 'id', description: 'Webhook ID', type: String })
    @ApiBasicResponse(200, 'Webhook deleted successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Webhook not found')
    public async delete(@CurrentUser() user: JWTUser, @Param() param: any, @Res() res: Response) {
        const response = await this.service.delete(user, param.id);
        res.status(response.status).send(response.data);
    }
}

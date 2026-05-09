import { Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Permission } from '@common/decorators';
import { Permissions } from '@api/roles';
import { Response } from 'express';
import { JWTUser } from '@auth/jwt.strategy';
import { EventsService } from './event.service';

@ApiTags('events')
@Controller('events')
export class EventsController {
    constructor(private service: EventsService) {}

    @ApiOperation({ summary: 'Get Events' })
    @Get()
    @Permission(Permissions.EventsRead)
    public async getAll(@Res() res: Response, @CurrentUser() user: JWTUser, @Query() query: any) {
        const response = await this.service.get(user, query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get One Event' })
    @Permission(Permissions.EventsRead)
    @Get('/:id')
    public async get(@CurrentUser() user: JWTUser, @Param() param: any, @Query() query: any, @Res() res: Response) {
        const response = await this.service.getOne(user, param.id, query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Retry Event' })
    @Permission(Permissions.EventsUpdateRetry)
    @Post('/:id/retry')
    public async requestApproval(@Res() res: Response, @CurrentUser() user: JWTUser, @Param() param: any) {
        const response = await this.service.postIdAction(user, param.id, 'retry');
        res.status(response.status).send(response.data);
    }
}

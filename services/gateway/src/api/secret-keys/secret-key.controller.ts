import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Permission } from '@common/decorators';
import { Permissions } from '@api/roles';
import { CreateSecretKeyDto, PatchSecretKeyDto } from './secret-key.dto';
import { SecretKeyService } from './secret-key.service';
import { JWTUser } from '@auth/jwt.strategy';
import { APIPagingDto } from '@common/api-paging';
import { ParamIdDto, ParamMongoIdDto } from '@common/dtos';
import { Request } from 'express';

@ApiTags('secret-keys')
@Controller('secret-keys')
export class SecretKeyController {
    constructor(private service: SecretKeyService) {}

    @ApiOperation({ summary: 'Get Project Access Keys ' })
    @Get()
    @Permission(Permissions.SecretKeyRead)
    public async getAll(@CurrentUser() user: JWTUser, @Query() query: APIPagingDto) {
        return await this.service.repo.findByQuery(query, { business: user.businessId });
    }

    @ApiOperation({ summary: 'Get One Project Access Keys ' })
    @Get('/:id')
    @Permission(Permissions.SecretKeyRead)
    public async getOne(@CurrentUser() user: JWTUser, @Param() param: ParamIdDto, @Query() query: APIPagingDto) {
        return await this.service.repo.findOneWithOptions({
            conditions: { _id: param.id, business: user.businessId },
            select: query.select,
        });
    }

    @ApiOperation({ summary: 'Create Access Key' })
    @Permission(Permissions.SecretKeyCreate)
    @Post()
    public async create(@CurrentUser() user: JWTUser, @Body() body: CreateSecretKeyDto, @Req() req: Request) {
        return await this.service.create(user, body, req);
    }

    @ApiOperation({ summary: 'Update Access Key' })
    @Permission(Permissions.SecretKeyUpdate)
    @Put('/:id')
    public async put(
        @CurrentUser() user: JWTUser,
        @Param() param: ParamMongoIdDto,
        @Body() body: PatchSecretKeyDto,
        @Req() req: Request,
    ) {
        return await this.service.update(user, param.id, body, req);
    }

    @ApiOperation({ summary: 'Delete Access Key' })
    @Permission(Permissions.SecretKeyDelete)
    @Delete('/:id')
    public async delete(@CurrentUser() user: JWTUser, @Param() param: ParamMongoIdDto, @Req() req: Request) {
        return this.service.delete(param.id, user, req);
    }
}

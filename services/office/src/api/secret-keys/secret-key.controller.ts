import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Permission } from '@common/decorators';
import { Permissions } from '@api/roles';
import { SecretKeyService } from './secret-key.service';
import { APIPagingDto } from '@common/api-paging';
import { ParamTagIdDto } from '@common/dtos';

@ApiTags('secret-keys')
@Controller('secret-keys')
export class SecretKeyController {
    constructor(private service: SecretKeyService) {}

    @ApiOperation({ summary: 'Get Project Secret Keys ' })
    @Get()
    @Permission(Permissions.SecretKeyRead)
    public async getAll(@Query() query: APIPagingDto) {
        return await this.service.getAll(query);
    }

    @ApiOperation({ summary: 'Get One Project Secret Key' })
    @ApiParam({ name: 'id', description: 'Secret Key ID', type: String })
    @Get('/:id')
    @Permission(Permissions.SecretKeyRead)
    public async getOne(@Query() query: APIPagingDto, @Param() param: ParamTagIdDto) {
        return this.service.getOne(param.id, query);
    }
}

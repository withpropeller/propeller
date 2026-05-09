import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Permission } from '@common/decorators';
import { Permissions } from '@api/roles';
import { AuditService } from './audit.service';
import { APIPagingDto } from '@common/api-paging';
import { PermissionsGuard } from '@auth/guards/permission.guard';
import { ParamTagIdDto } from '@common/dtos';

@ApiTags('audits')
@Controller('audits')
@UseGuards(PermissionsGuard)
export class AuditController {
    constructor(private service: AuditService) {}

    @ApiOperation({ summary: 'Read All Audits' })
    @Permission(Permissions.AuditRead)
    @Get()
    public async getAll(@Query() query: APIPagingDto) {
        return this.service.getAll(query);
    }

    @ApiOperation({ summary: 'Read One All Audits' })
    @ApiParam({ name: 'id', description: 'Audit ID', type: String })
    @Get('/:id')
    @Permission(Permissions.AuditRead)
    public async getOne(@Query() query: APIPagingDto, @Param() param: ParamTagIdDto) {
        return this.service.getOne(param.id, query);
    }
}

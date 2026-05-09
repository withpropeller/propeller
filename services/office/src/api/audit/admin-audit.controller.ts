import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@common/decorators';
import { Permissions } from '@api/roles';
import { APIPagingDto } from '@common/api-paging';
import { PermissionsGuard } from '@auth/guards/permission.guard';
import { AdminAuditService } from './admin-audit.service';

@ApiTags('admin-audits')
@Controller('admin-audits')
@UseGuards(PermissionsGuard)
export class AdminAuditController {
    constructor(private service: AdminAuditService) {}

    @ApiOperation({ summary: 'Read All Audits' })
    @Permission(Permissions.AuditRead)
    @Get()
    public async getAll(@Query() query: APIPagingDto) {
        return this.service.repo.findByQuery(query);
    }
}

import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Permission } from '@common/decorators';
import { Permissions } from '@api/roles';
import { AuditService } from './audit.service';
import { APIPagingDto } from '@common/api-paging';

@ApiTags('audits')
@Controller('audits')
export class AuditController {
    constructor(private service: AuditService) {}

    @ApiOperation({ summary: 'Read All Audits' })
    @Permission(Permissions.AuditList)
    @Get()
    public async getAll(@Query() query: APIPagingDto, @CurrentUser('businessId') businessId: string) {
        return this.service.repo.findByQuery(query, { business: businessId });
    }
}

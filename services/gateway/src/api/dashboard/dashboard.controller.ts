import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@common/decorators';
import { Permissions } from '@api/roles';
import { DashboardService } from './dashboard.service';
import { DashboardMetricsQueryDto, DashboardMetricsResponseDto } from './dashboard.dto';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly service: DashboardService) {}

    @ApiOperation({ summary: 'Get treasury dashboard metrics' })
    @ApiOkResponse({ type: DashboardMetricsResponseDto, description: 'Treasury dashboard metrics' })
    @Get('metrics')
    @Permission(Permissions.PaymentRead)
    public getMetrics(@Query() query: DashboardMetricsQueryDto): DashboardMetricsResponseDto {
        return this.service.getMetrics(query);
    }
}

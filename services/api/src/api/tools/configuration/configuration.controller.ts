import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SecretKeyPermissions as Permissions } from '@api/secret-keys';
import { APIPagingDto } from '@common/api-paging';
import { CurrentAccessKey, Permission } from '@common/decorators';
import { AccessKey } from '@core/interfaces';
import { ConfigurationService } from './configuration.service';
import { PaymentConfigurationDto } from './configuration.dto';

@ApiTags('tools/configuration')
@Controller('tools/configuration')
export class ConfigurationController {
    constructor(private service: ConfigurationService) {}

    @ApiOperation({ summary: 'Get Configuration' })
    @Get()
    @Permission(Permissions.ConfigurationsRead)
    public async get(@CurrentAccessKey() key: AccessKey, @Query() query: APIPagingDto) {
        return this.service.repo.findOneWithOptions({
            conditions: { business: key.businessId },
            expand: query.expand,
            select: query.select,
        });
    }

    @ApiOperation({ summary: 'Update Payment Configuration' })
    @Put('/payment')
    @Permission(Permissions.ConfigurationsUpdate)
    public async updatePayment(@CurrentAccessKey() key: AccessKey, @Body() body: PaymentConfigurationDto) {
        return this.service.updatePayment(key.businessId, body);
    }
}

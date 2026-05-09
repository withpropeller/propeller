import { APIPagingDto } from '@common/api-paging';
import { Permission } from '@common/decorators';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MerchantService } from './merchant.service';
import { SecretKeyPermissions as Permissions } from '@api/secret-keys';
import { ParamTagIdDto } from '@common/dtos';

@ApiTags('tools/merchants')
@Controller('tools/merchants')
export class MerchantController {
    constructor(private service: MerchantService) {}

    @ApiOperation({ summary: 'Get All Merchants' })
    @Get('/')
    @Permission(Permissions.ToolsMerchantsRead)
    public async getMerchants(@Query() query: APIPagingDto) {
        return this.service.findByQuery(query);
    }

    @ApiOperation({ summary: 'Get Merchant Categories' })
    @Get('/categories')
    @Permission(Permissions.ToolsMerchantsRead)
    public async getMerchantCategories() {
        return this.service.getMerchantCategories();
    }

    @ApiOperation({ summary: 'Get One Merchant' })
    @Get('/:id')
    @Permission(Permissions.ToolsMerchantsRead)
    public async getMerchantById(@Query() query: APIPagingDto, @Param() param: ParamTagIdDto) {
        return this.service.findOneWithOptions({
            conditions: { _id: param.id },
            select: query?.select,
        });
    }
}

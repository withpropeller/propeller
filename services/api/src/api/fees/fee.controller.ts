import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SecretKeyPermissions as Permissions } from '@api/secret-keys';
import { APIPagingDto } from '@common/api-paging';
import { CurrentAccessKey, Permission } from '@common/decorators';
import { AccessKey } from '@core/interfaces';
import { FeeService } from './fee.service';
import { ParamTagIdDto } from '@common/dtos';
import { CreateFeeDto } from './fee.dto';

@ApiTags('fees')
@Controller('fees')
export class FeeController {
    constructor(private service: FeeService) { }

    @ApiOperation({ summary: 'Get Fees' })
    @Get()
    @Permission(Permissions.FeesRead)
    public async get(@CurrentAccessKey() key: AccessKey, @Query() query: APIPagingDto) {
        return this.service.repo.findByQuery(query, {
            business: key.businessId,
        });
    }

    @ApiOperation({ summary: 'Get One Fee' })
    @Get('/:id')
    @Permission(Permissions.FeesRead)
    public async getOne(
        @CurrentAccessKey() key: AccessKey,
        @Query() query: APIPagingDto,
        @Param() param: ParamTagIdDto,
    ) {
        return this.service.repo.findOneWithOptions({
            conditions: { business: key.businessId, _id: param.id },
            expand: query.expand,
        });
    }

    @ApiOperation({ summary: 'Create Fee' })
    @Post()
    @Permission(Permissions.FeesCreate)
    public async create(@CurrentAccessKey() key: AccessKey, @Body() body: CreateFeeDto) {
        return this.service.createFee(body, key);
    }
}

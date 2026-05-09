import { CurrentUser, Permission } from '@common/decorators';
import { Body, Controller, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Permissions } from '@api/roles/roles.enums';
import { ParamTagIdDto } from '@common/dtos';
import { CreateBillProductDto, UpdateBillProductDto } from './bill-product.dto';
import { BillProductService } from './bill-product.service';
import { JWTUser } from '@auth/jwt.strategy';
import { APIPagingDto } from '@common/api-paging';
import { Request } from 'express';
import { BillingCategory } from './bill-product.enums';

@ApiTags('tools/bills')
@Controller('tools/bills')
export class BillingProductController {
    constructor(private service: BillProductService) {}

    @ApiOperation({ summary: 'Add Bill Product' })
    @Get('/categories')
    @Permission(Permissions.ToolsBillingRead)
    public async fetchCategories() {
        return [
            { name: 'Airtime', slug: BillingCategory.Airtime },
            { name: 'Data Subscriptions', slug: BillingCategory.Data },
            { name: 'Utilities', slug: BillingCategory.Utilities },
            { name: 'Cable TV', slug: BillingCategory.CableTV },
        ];
    }

    @ApiOperation({ summary: 'Get All Bill Products' })
    @Get('/products')
    @Permission(Permissions.ToolsBillingRead)
    public async getBillProducts(@Query() query: APIPagingDto) {
        return this.service.repo.findByQuery(query, {
            parent: { $exists: false },
        });
    }

    @ApiOperation({ summary: 'Get One Bill Product' })
    @ApiParam({ name: 'id', description: 'Bill Product ID', type: String })
    @Get('/products/:id')
    @Permission(Permissions.ToolsBillingRead)
    public async getOneBillProduct(@Param() param: ParamTagIdDto, @Query() query: APIPagingDto) {
        return this.service.repo.findOneWithOptions({
            conditions: { _id: param.id },
            expand: query.expand,
            select: query.select,
        });
    }

    @ApiOperation({ summary: 'Add Bill Product' })
    @Post('/products')
    @Permission(Permissions.ToolsBillingCreate)
    public async create(
        @CurrentUser() user: JWTUser,
        @Body() body: CreateBillProductDto,
        @Req() req: Request,
        @Query() query: APIPagingDto,
    ) {
        return this.service.create(user.userId, body, query, req);
    }

    @ApiOperation({ summary: 'Update Bill Product' })
    @ApiParam({ name: 'id', description: 'Bill Product ID', type: String })
    @Put('/products/:id')
    @Permission(Permissions.ToolsBillingUpdate)
    public async update(
        @CurrentUser() user: JWTUser,
        @Param() param: ParamTagIdDto,
        @Body() body: UpdateBillProductDto,
        @Req() req: Request,
        @Query() query: APIPagingDto,
    ) {
        return this.service.update(user.userId, param.id, body, query, req);
    }
}

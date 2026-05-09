import { Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
    CurrentUser,
    Permission,
    ApiResponseWrapper,
    ApiResponseListWrapper,
    ApiBasicResponse,
    ApiCommonResponse,
} from '@common/decorators';
import { APIPagingDto } from '@common/api-paging';
import { BillingService } from './billing.service';
import { MetricsQueryDto, ParamTagIdDto } from '@common/dtos';
import { Permissions } from '@api/roles';
import { Request, Response } from 'express';
import { JWTUser } from '@auth/jwt.strategy';
import { ApiHydratedBilling } from './billing.schema';
import { BillingMetricsDto } from './billing.dto';

@ApiTags('billings')
@Controller('billings')
export class BillingController {
    constructor(private service: BillingService) {}

    @ApiOperation({ summary: 'Get All Billings' })
    @ApiBearerAuth()
    @Get()
    @Permission(Permissions.BillingsRead)
    @HttpCode(HttpStatus.OK)
    @ApiResponseListWrapper(ApiHydratedBilling, 200, 'Billings retrieved successfully')
    @ApiCommonResponse()
    public getAll(@Query() query: APIPagingDto) {
        return this.service.getAll(query);
    }

    @ApiOperation({ summary: 'Download Billings in CSV' })
    @ApiBearerAuth()
    @Permission(Permissions.BillingsRead)
    @Get('/csv')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'CSV file download')
    @ApiCommonResponse()
    public async getBalanceHistoryCSV(@Query() query: APIPagingDto, @Res() res: Response) {
        const [csvText, fileName] = await this.service.getCSV(query);

        res.writeHead(200, {
            'Content-Type': 'text/csv',
            'Content-Length': Buffer.byteLength(csvText),
            'Content-Disposition': `attachment; filename="${fileName}"`,
        });
        res.write(csvText);
        res.end();
    }

    @ApiOperation({ summary: 'Get Billing Metrics' })
    @ApiBearerAuth()
    @Permission(Permissions.BillingsRead)
    @Get('/metrics')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(BillingMetricsDto, 200, 'Billing metrics retrieved successfully')
    @ApiCommonResponse()
    public async getMetrics(@Query() query: MetricsQueryDto) {
        return this.service.getMetrics(query);
    }

    @ApiOperation({ summary: 'Get One Billing' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Billing ID', type: String })
    @Get('/:id')
    @Permission(Permissions.BillingsRead)
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedBilling, 200, 'Billing retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Billing not found')
    public async getOne(@Query() query: APIPagingDto, @Param() param: ParamTagIdDto) {
        return this.service.getOne(param.id, query);
    }

    @ApiOperation({ summary: 'Charge Billing' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Billing ID', type: String })
    @Post('/:id/charge')
    @Permission(Permissions.BillingsCharge)
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Billing charged successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Billing not found')
    public async charge(
        @CurrentUser() user: JWTUser,
        @Req() req: Request,
        @Query() query: APIPagingDto,
        @Param() param: ParamTagIdDto,
    ) {
        return this.service.charge(user.userId, param.id, req, query);
    }
}

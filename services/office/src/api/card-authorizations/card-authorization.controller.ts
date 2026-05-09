import { Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { APIPagingDto } from '@common/api-paging';
import {
    CurrentUser,
    Permission,
    ApiResponseWrapper,
    ApiResponseListWrapper,
    ApiBasicResponse,
    ApiCommonResponse,
} from '@common/decorators';
import { ParamTagIdDto } from '@common/dtos';
import { MetricsQueryDto } from '@common/dtos';
import { CardAuthMetricsDto } from './card-authorization.dto';
import { Permissions } from '@api/roles';
import { CardAuthorizationService } from './card-authorization.service';
import { JWTUser } from '@auth/jwt.strategy';
import { Request, Response } from 'express';
import { ApiHydratedCardAuthorization } from './card-authorization.schema';

@ApiTags('card-authorizations')
@Controller('card-authorizations')
export class CardAuthorizationController {
    constructor(private service: CardAuthorizationService) {}

    @ApiOperation({ summary: 'Get Card Authorizations' })
    @ApiBearerAuth()
    @Get()
    @Permission(Permissions.CardAuthorizationRead)
    @HttpCode(HttpStatus.OK)
    @ApiResponseListWrapper(ApiHydratedCardAuthorization, 200, 'Card authorizations retrieved successfully')
    @ApiCommonResponse()
    public async get(@Query() query: APIPagingDto) {
        return this.service.getAll(query);
    }

    @ApiOperation({ summary: 'Download All Authorizations in CSV' })
    @ApiBearerAuth()
    @Permission(Permissions.CardAuthorizationRead)
    @Get('/csv')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'CSV file download')
    @ApiCommonResponse()
    public async getCSV(@Query() query: APIPagingDto, @Res() res: Response) {
        const [csvText, fileName] = await this.service.getCSV(query);

        res.writeHead(200, {
            'Content-Type': 'text/csv',
            'Content-Length': Buffer.byteLength(csvText),
            'Content-Disposition': `attachment; filename="${fileName}"`,
        });
        res.write(csvText);
        res.end();
    }

    @ApiOperation({ summary: 'Get Card Authorization Metrics' })
    @ApiBearerAuth()
    @Get('/metrics')
    @Permission(Permissions.CardAuthorizationRead)
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(CardAuthMetricsDto, 200, 'Card authorization metrics retrieved successfully')
    @ApiCommonResponse()
    public async getMetrics(@Query() query: MetricsQueryDto) {
        return this.service.getMetrics(query);
    }

    @ApiOperation({ summary: 'Get One Card Authorization' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Card Authorization ID', type: String })
    @Get('/:id')
    @Permission(Permissions.CardAuthorizationRead)
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedCardAuthorization, 200, 'Card authorization retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Card authorization not found')
    public async getOne(@Query() query: APIPagingDto, @Param() param: ParamTagIdDto) {
        return this.service.getOne(param.id, query);
    }

    @ApiOperation({ summary: 'Force Debit Lien on Card Authorization' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Card Authorization ID', type: String })
    @Post('/:id/force-debit-lien')
    @Permission(Permissions.CardAuthorizationForceDebitLien)
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Force debit lien initiated successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Card authorization not found')
    public async forceDebitLien(
        @CurrentUser() user: JWTUser,
        @Query() query: APIPagingDto,
        @Param() param: ParamTagIdDto,
        @Req() req: Request,
    ) {
        return this.service.forceDebitLien(user.userId, param.id, req, query);
    }

    @ApiOperation({ summary: 'Bulk Force Debit Lien on Card Authorizations' })
    @ApiBearerAuth()
    @Post('/bulk-force-debit-lien')
    @Permission(Permissions.CardAuthorizationForceDebitLien)
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Bulk force debit lien initiated successfully')
    @ApiCommonResponse()
    public async bulkDebitLien(@CurrentUser() user: JWTUser, @Query() query: APIPagingDto, @Req() req: Request) {
        return this.service.bulkDebitLien(user.userId, query, req);
    }

    @ApiOperation({ summary: 'Force Reversal on Card Authorization' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Card Authorization ID', type: String })
    @Post('/:id/force-reversal')
    @Permission(Permissions.CardAuthorizationForceDebitLien)
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Force reversal initiated successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Card authorization not found')
    public async forceReversal(
        @CurrentUser() user: JWTUser,
        @Query() query: APIPagingDto,
        @Param() param: ParamTagIdDto,
        @Req() req: Request,
    ) {
        return this.service.forceReversal(user.userId, param.id, req, query);
    }
}

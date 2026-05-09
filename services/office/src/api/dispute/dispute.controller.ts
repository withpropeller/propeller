import {
    CurrentUser,
    Permission,
    ApiResponseWrapper,
    ApiResponseListWrapper,
    ApiBasicResponse,
    ApiCommonResponse,
} from '@common/decorators';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { APIPagingDto } from '@common/api-paging';
import { MetricsQueryDto, ParamTagIdDto } from '@common/dtos';
import { DisputeService } from './dispute.service';
import { UpdateDisputeDto, DisputeMetricsDto } from './dispute.dto';
import { Permissions } from '@api/roles';
import { JWTUser } from '@auth/jwt.strategy';
import { Request, Response } from 'express';
import { ApiHydratedDispute } from './dispute.schema';

@ApiTags('disputes')
@Controller('disputes')
export class DisputeController {
    constructor(private service: DisputeService) {}

    @ApiOperation({ summary: 'Get Disputes' })
    @ApiBearerAuth()
    @Permission(Permissions.DisputeRead)
    @Get('/')
    @HttpCode(HttpStatus.OK)
    @ApiResponseListWrapper(ApiHydratedDispute, 200, 'Disputes retrieved successfully')
    @ApiCommonResponse()
    public async getDispute(@Query() query: APIPagingDto) {
        return this.service.getAll(query);
    }

    @ApiOperation({ summary: 'Get Dispute Metrics' })
    @ApiBearerAuth()
    @Permission(Permissions.DisputeRead)
    @Get('/metrics')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(DisputeMetricsDto, 200, 'Dispute metrics retrieved successfully')
    @ApiCommonResponse()
    public async getMetrics(@Query() query: MetricsQueryDto) {
        return this.service.getMetrics(query);
    }

    @ApiOperation({ summary: 'Download All Disputes in CSV' })
    @ApiBearerAuth()
    @Permission(Permissions.DisputeRead)
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

    @ApiOperation({ summary: 'Get One Dispute' })
    @ApiBearerAuth()
    @Permission(Permissions.DisputeRead)
    @ApiParam({ name: 'id', description: 'Dispute ID', type: String })
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedDispute, 200, 'Dispute retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Dispute not found')
    public async getOne(@Query() query: APIPagingDto, @Param() param: ParamTagIdDto) {
        return this.service.getOne(param.id, query);
    }

    @ApiOperation({ summary: 'Update Dispute' })
    @ApiBearerAuth()
    @Permission(Permissions.DisputeUpdate)
    @ApiParam({ name: 'id', description: 'Dispute ID', type: String })
    @Put('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedDispute, 200, 'Dispute updated successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Dispute not found')
    public async update(
        @Req() req: Request,
        @CurrentUser() user: JWTUser,
        @Query() query: APIPagingDto,
        @Param() param: ParamTagIdDto,
        @Body() body: UpdateDisputeDto,
    ) {
        return this.service.update(user.userId, param.id, body, query, req);
    }

    @ApiOperation({ summary: 'Close Dispute' })
    @ApiBearerAuth()
    @Permission(Permissions.DisputeUpdate)
    @ApiParam({ name: 'id', description: 'Dispute ID', type: String })
    @Put('/:id/close')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedDispute, 200, 'Dispute closed successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Dispute not found')
    public async close(
        @Req() req: Request,
        @CurrentUser() user: JWTUser,
        @Query() query: APIPagingDto,
        @Param() param: ParamTagIdDto,
        @Body() body: UpdateDisputeDto,
    ) {
        return this.service.close(user.userId, param.id, body, query, req);
    }

    @ApiOperation({ summary: 'Resolve Dispute' })
    @ApiBearerAuth()
    @Permission(Permissions.DisputeUpdate)
    @ApiParam({ name: 'id', description: 'Dispute ID', type: String })
    @Put('/:id/resolve')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedDispute, 200, 'Dispute resolved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Dispute not found')
    public async resolve(
        @Req() req: Request,
        @CurrentUser() user: JWTUser,
        @Query() query: APIPagingDto,
        @Param() param: ParamTagIdDto,
        @Body() body: UpdateDisputeDto,
    ) {
        return this.service.resolve(user.userId, param.id, body, query, req);
    }

    @ApiOperation({ summary: 'Refund Dispute' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', description: 'Dispute ID', type: String })
    @Post('/:id/refund')
    @HttpCode(HttpStatus.OK)
    @Permission(Permissions.DisputeRefund)
    @ApiBasicResponse(200, 'Dispute refund initiated successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Dispute not found')
    public async refund(
        @Req() req: Request,
        @CurrentUser() user: JWTUser,
        @Param() param: ParamTagIdDto,
        @Query() query: APIPagingDto,
        @Body() body: UpdateDisputeDto,
    ) {
        return this.service.refund(user.userId, param.id, body, query, req);
    }

    @ApiOperation({ summary: 'Reopen Dispute' })
    @ApiBearerAuth()
    @Permission(Permissions.DisputeUpdate)
    @ApiParam({ name: 'id', description: 'Dispute ID', type: String })
    @Put('/:id/reopen')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedDispute, 200, 'Dispute reopened successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Dispute not found')
    public async reopen(
        @Req() req: Request,
        @CurrentUser() user: JWTUser,
        @Query() query: APIPagingDto,
        @Param() param: ParamTagIdDto,
        @Body() body: UpdateDisputeDto,
    ) {
        return this.service.reopen(user.userId, param.id, body, query, req);
    }
}

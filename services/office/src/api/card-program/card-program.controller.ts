import { ParamTagIdDto, MetricsQueryDto } from '@common/dtos';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
    ApiBasicResponse,
    ApiCommonResponse,
    ApiResponseListWrapper,
    ApiResponseWrapper,
    CurrentUser,
    Permission,
} from '@common/decorators';
import { CardProgramService } from './card-program.service';
import { APIPagingDto } from '@common/api-paging';
import { Request, Response } from 'express';
import { JWTUser } from '@auth/jwt.strategy';
import { Permissions } from '@api/roles';
import {
    ApproveCardProgramDto,
    CardProgramMetricsDto,
    CreateTestCardProgramDto,
    UpdateCardProgramStatuesDto,
} from './card-program.dto';
import { ApiHydratedCardProgram } from './card-program.schema';

@ApiTags('card-programs')
@ApiBearerAuth()
@Controller('card-programs')
export class CardProgramController {
    constructor(private service: CardProgramService) {}

    @ApiOperation({ summary: 'Get Card Programs' })
    @Permission(Permissions.CardProgramRead)
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiResponseListWrapper(ApiHydratedCardProgram, 200, 'Card programs retrieved successfully')
    @ApiCommonResponse()
    public getCardPrograms(@Query() query: APIPagingDto) {
        return this.service.getAll(query);
    }

    @ApiOperation({ summary: 'Get Card Program Metrics' })
    @Permission(Permissions.CardProgramRead)
    @Get('/metrics')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(CardProgramMetricsDto, 200, 'Card program metrics retrieved successfully')
    @ApiCommonResponse()
    public async getMetrics(@Query() query: MetricsQueryDto) {
        return this.service.getMetrics(query);
    }

    @ApiOperation({ summary: 'Create Test Card Program' })
    @Permission(Permissions.CardProgramCreate)
    @Post('/test')
    @HttpCode(HttpStatus.CREATED)
    @ApiResponseWrapper(ApiHydratedCardProgram, 201, 'Test card program created successfully')
    @ApiCommonResponse()
    public async createTest(@CurrentUser() user: JWTUser, @Req() req: Request, @Body() body: CreateTestCardProgramDto) {
        return this.service.createTest(user.userId, body, req);
    }

    @ApiOperation({ summary: 'Get One Card Program' })
    @ApiParam({ name: 'id', description: 'Card Program ID', type: String })
    @Permission(Permissions.CardProgramRead)
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedCardProgram, 200, 'Card program retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Card program not found')
    public async getOne(@Query() query: APIPagingDto, @Param() param: ParamTagIdDto) {
        return this.service.getOne(param.id, query);
    }

    @ApiOperation({ summary: 'Get Card Program Batches' })
    @ApiParam({ name: 'id', description: 'Card Program ID', type: String })
    @Permission(Permissions.CardProgramRead)
    @Get('/:id/batch')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Card program batches retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Card program not found')
    public async getBatchCards(@Param() param: ParamTagIdDto) {
        return this.service.getCardBatches(param.id);
    }

    @ApiOperation({ summary: 'Generate Cards' })
    @ApiParam({ name: 'id', description: 'Card Program ID', type: String })
    @Permission(Permissions.CardProgramUpdate)
    @Post('/:id/generate')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Card ZIP file download')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Card program not found')
    public async generateCards(
        @CurrentUser() user: JWTUser,
        @Res() res: Response,
        @Req() req: Request,
        @Param() param: ParamTagIdDto,
    ) {
        const [stream, fileName] = await this.service.generate(user.userId, param.id, req);

        res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-Length': Buffer.byteLength(stream),
            'Content-Disposition': `attachment; filename="${fileName}"`,
        });
        res.write(stream);
        res.end();
    }

    @ApiOperation({ summary: 'Card Program Approve' })
    @ApiParam({ name: 'id', description: 'Card Program ID', type: String })
    @Permission(Permissions.CardProgramUpdate)
    @Post('/:id/approve')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedCardProgram, 200, 'Card program approved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Card program not found')
    public async approve(
        @CurrentUser() user: JWTUser,
        @Req() req: Request,
        @Body() body: ApproveCardProgramDto,
        @Param() param: ParamTagIdDto,
        @Query() query: APIPagingDto,
    ) {
        return this.service.approve(user.userId, param.id, body, req, query);
    }

    @ApiOperation({ summary: 'Update Card Program Status' })
    @ApiParam({ name: 'id', description: 'Card Program ID', type: String })
    @Permission(Permissions.CardProgramUpdate)
    @Post('/:id/personalise')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedCardProgram, 200, 'Card program status updated successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Card program not found')
    public async updateStatus(
        @CurrentUser() user: JWTUser,
        @Req() req: Request,
        @Body() body: UpdateCardProgramStatuesDto,
        @Param() param: ParamTagIdDto,
        @Query() query: APIPagingDto,
    ) {
        return this.service.personalise(user.userId, param.id, body, req, query);
    }

    @ApiOperation({ summary: 'Card Program Go Live' })
    @ApiParam({ name: 'id', description: 'Card Program ID', type: String })
    @Permission(Permissions.CardProgramUpdate)
    @Post('/:id/go-live')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Card program set to live successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Card program not found')
    public async goLive(@CurrentUser() user: JWTUser, @Req() req: Request, @Param() param: ParamTagIdDto) {
        return this.service.goLive(user.userId, param.id, req);
    }

    /*@ApiOperation({ summary: 'Card Program Cards Link' })
    @Post('/:id/unlink-cards')
    @Permission(Permissions.CardProgramCardUnlink)
    public async unlinkProgramCards(@CurrentUser() user: JWTUser, @Req() req: Request, @Param() param: ParamTagIdDto) {
        return this.service.unlinkProgramCards(user.userId, param.id, req);
    }*/

    @ApiOperation({ summary: 'Card Program Card Unlink' })
    @ApiParam({ name: 'id', description: 'Card ID', type: String })
    @Permission(Permissions.CardProgramCardUnlink)
    @Post('/cards/:id/unlink')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Card unlinked from program successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Card not found')
    public async unlinkCard(@CurrentUser() user: JWTUser, @Req() req: Request, @Param() param: ParamTagIdDto) {
        return this.service.unlinkCard(user.userId, param.id, req);
    }

    @ApiOperation({ summary: 'Get Card Program Card Status' })
    @ApiParam({ name: 'id', description: 'Card ID', type: String })
    @Permission(Permissions.CardProgramCardRead)
    @Get('/cards/:id/status')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'Card status retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Card not found')
    public async getCardStatus(@Param() param: ParamTagIdDto) {
        return this.service.getCardStatus(param.id);
    }
}

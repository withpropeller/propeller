import { ParamTagIdDto } from '@common/dtos';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { APIPagingDto } from '@common/api-paging';
import {
    ApiBasicResponse,
    ApiCommonResponse,
    ApiResponseListWrapper,
    ApiResponseWrapper,
    Permission,
} from '@common/decorators';
import { Permissions } from '@api/roles';
import { CardBinService } from './card-bin.service';
import { CreateCardBinDto } from './card-bin.dto';
import { ApiHydratedCardBin } from './card-bin.schema';

@ApiTags('card-bins')
@ApiBearerAuth()
@Controller('card-bins')
export class CardBinController {
    constructor(private service: CardBinService) {}

    @ApiOperation({ summary: 'Get Card BINs' })
    @Get()
    @HttpCode(HttpStatus.OK)
    @Permission(Permissions.CardBinRead)
    @ApiResponseListWrapper(ApiHydratedCardBin, 200, 'Card BINs retrieved successfully')
    @ApiCommonResponse()
    public getAll(@Query() query: APIPagingDto) {
        return this.service.getAll(query);
    }

    @ApiOperation({ summary: 'Create Card BIN' })
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @Permission(Permissions.CardBinCreate)
    @ApiResponseWrapper(ApiHydratedCardBin, 201, 'Card BIN created successfully')
    @ApiCommonResponse()
    public create(@Body() body: CreateCardBinDto) {
        return this.service.create(body);
    }

    @ApiOperation({ summary: 'Get Card BIN' })
    @ApiParam({ name: 'id', description: 'Card BIN ID', type: String })
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    @Permission(Permissions.CardBinRead)
    @ApiResponseWrapper(ApiHydratedCardBin, 200, 'Card BIN retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Card BIN not found')
    public get(@Param() param: ParamTagIdDto, @Query() query: APIPagingDto) {
        return this.service.getOne(param.id, query);
    }
}

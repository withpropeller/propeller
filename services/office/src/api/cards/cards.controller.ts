import { Permission, ApiResponseWrapper, ApiResponseListWrapper, ApiBasicResponse, ApiCommonResponse } from '@common/decorators';
import { Controller, Get, HttpCode, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CardsService } from './cards.service';
import { APIPagingDto } from '@common/api-paging';
import { MetricsQueryDto, ParamTagIdDto } from '@common/dtos';
import { Permissions } from '@api/roles';
import { ApiHydratedCard } from './cards.schema';
import { CardMetricsDto } from './cards.dto';

@ApiTags('cards')
@ApiBearerAuth()
@Controller('cards')
export class CardsController {
    constructor(private service: CardsService) {}

    @ApiOperation({ summary: 'Get Cards' })
    @Permission(Permissions.CardsReadInfo)
    @Get('/')
    @HttpCode(HttpStatus.OK)
    @ApiResponseListWrapper(ApiHydratedCard, 200, 'Cards retrieved successfully')
    @ApiCommonResponse()
    public async getCards(@Query() query: APIPagingDto) {
        return this.service.getAll(query);
    }

    @ApiOperation({ summary: 'Get Card Metrics' })
    @Permission(Permissions.CardsReadInfo)
    @Get('metrics')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(CardMetricsDto, 200, 'Card metrics retrieved successfully')
    @ApiCommonResponse()
    public async getMetrics(@Query() query: MetricsQueryDto) {
        return this.service.getMetrics(query);
    }

    @ApiOperation({ summary: 'Fetch Card' })
    @ApiParam({ name: 'id', description: 'Card ID', type: String })
    @Permission(Permissions.CardsReadInfo)
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedCard, 200, 'Card retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Card not found')
    public async getOne(@Query() query: APIPagingDto, @Param() param: ParamTagIdDto) {
        return this.service.getOne(param.id, query);
    }
}

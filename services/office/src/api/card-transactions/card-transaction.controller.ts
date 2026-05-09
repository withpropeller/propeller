import { Controller, Get, HttpCode, HttpStatus, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { APIPagingDto } from '@common/api-paging';
import {
    ApiBasicResponse,
    ApiCommonResponse,
    ApiResponseListWrapper,
    ApiResponseWrapper,
    Permission,
} from '@common/decorators';
import { ParamTagIdDto } from '@common/dtos';
import { Permissions } from '@api/roles';
import { CardTransactionService } from './card-transaction.service';
import { ApiHydratedCardTransaction } from './card-transaction.schema';

@ApiTags('card-transactions')
@ApiBearerAuth()
@Controller('card-transactions')
export class CardTransactionController {
    constructor(private service: CardTransactionService) {}

    @ApiOperation({ summary: 'Get Card Transactions' })
    @Permission(Permissions.CardTransactionRead)
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiResponseListWrapper(ApiHydratedCardTransaction, 200, 'Card transactions retrieved successfully')
    @ApiCommonResponse()
    public async get(@Query() query: APIPagingDto) {
        return this.service.getAll(query);
    }

    @ApiOperation({ summary: 'Get One Card Transaction' })
    @ApiParam({ name: 'id', description: 'Card Transaction ID', type: String })
    @Permission(Permissions.CardTransactionRead)
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ApiHydratedCardTransaction, 200, 'Card transaction retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Card transaction not found')
    public async getOne(@Query() query: APIPagingDto, @Param() param: ParamTagIdDto) {
        return this.service.getOne(param.id, query);
    }
}

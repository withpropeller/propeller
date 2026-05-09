import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SecretKeyPermissions as Permissions } from '@api/secret-keys';
import { Permission } from '@common/decorators';
import { CurrencyFromToDto } from '../tools.interface';
import { Utils } from '@core/helpers';
import { FxBuyQuoteDto, FxQuoteDto, FxSellQuoteDto } from './fx.dto';
import { FxService } from './fx.service';
import { FxQuoteType } from './fx.interface';

@ApiTags('tools/fx')
@Controller('tools/fx')
export class FxController {
    constructor(private service: FxService) {}

    @ApiOperation({ summary: 'Get Current FX Rate' })
    @Get('/rate')
    @Permission(Permissions.ToolsFxRate)
    public async getExchangeRate(@Query() query: CurrencyFromToDto) {
        const res = await this.service.getFxRate(query.from, query.to);
        return Utils.pickKeys(res, 'from to rate hash lastUpdated');
    }

    @ApiOperation({ summary: 'Get FX Quote' })
    @Post('/quote')
    @HttpCode(200)
    @Permission(Permissions.ToolsFxQuote)
    public async getFxQuote(@Body() body: FxQuoteDto) {
        const res = await this.service.getFxQuote(body);
        return Utils.pickKeys(res, 'fromCurrency toCurrency fromAmount toAmount rate hash');
    }

    @ApiOperation({ summary: 'Get FX Buy Quote' })
    @Post('/quote/buy')
    @HttpCode(200)
    @Permission(Permissions.ToolsFxQuote)
    public async getFxBuyQuote(@Body() body: FxBuyQuoteDto) {
        const res = await this.service.getFxQuote({
            from: body.fromCurrency,
            to: body.toCurrency,
            amount: body.toAmount,
            type: FxQuoteType.Buy,
        });
        return Utils.pickKeys(res, 'fromCurrency toCurrency fromAmount toAmount rate hash');
    }

    @ApiOperation({ summary: 'Get FX Sell Quote' })
    @Post('/quote/sell')
    @HttpCode(200)
    @Permission(Permissions.ToolsFxQuote)
    public async getFxSellQuote(@Body() body: FxSellQuoteDto) {
        const res = await this.service.getFxQuote({
            from: body.fromCurrency,
            to: body.toCurrency,
            amount: body.fromAmount,
            type: FxQuoteType.Sell,
        });
        return Utils.pickKeys(res, 'fromCurrency toCurrency fromAmount toAmount rate hash');
    }
}

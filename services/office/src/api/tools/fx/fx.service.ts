import { Injectable } from '@nestjs/common';
import { Fee, FeeBreakdownType, FeeStructure } from '@api/fees/fee.schema';
import { RedisKeys, Utils } from '@core/helpers';
import { RedisService } from '@core/services/redis.service';
import { BasicHash } from '@core/crypto/basic-hash';
import { FxQuote } from '@common/integrations/integrations.interfaces';
import Big from 'big.js';
import { TransactionCurrency } from '@api/transactions/transactions.enums';
import { AppException } from '@core/exceptions';
import { FxQuoteType, FxRate } from './fx.interface';
import { FxQuoteDto } from './fx.dto';

@Injectable()
export class FxService {
    constructor(private redisService: RedisService) {}

    async getFxRate(from: TransactionCurrency, to: TransactionCurrency): Promise<FxRate> {
        const key = `${RedisKeys.FxRateSettings}:${from}:${to}`;

        try {
            const results = (await this.redisService.timeSeriesGet(key)) as any;
            const exchangeRate = Number(results[1]);
            const exchangeRateFee = await this.calculateTransactionFee(exchangeRate, FeeBreakdownType.FxPurchase);

            const rate = Big(exchangeRate).minus(exchangeRateFee).toNumber();
            const hash = BasicHash.hash(from + to + rate);

            return {
                from,
                to,
                fee: exchangeRateFee,
                rate,
                originalRate: exchangeRate,
                hash,
                lastUpdated: new Date(results[0]),
            };
        } catch (err) {
            throw AppException.NotFound.setMessage('Exchange rate not found');
        }
    }

    async getFxQuote(data: FxQuoteDto): Promise<FxQuote> {
        const exchangeRate = await this.getFxRate(data.from, data.to);

        let fromAmount = 0;
        let toAmount = 0;
        if (data.type && data.type == FxQuoteType.Buy) {
            fromAmount = Big(data.amount).div(exchangeRate.rate).round(0).toNumber();
            toAmount = data.amount;
        } else {
            fromAmount = data.amount;
            toAmount = Big(data.amount).times(exchangeRate.rate).round(0).toNumber();
        }

        const fromAmountFee = await this.calculateTransactionFee(fromAmount, FeeBreakdownType.FxPurchase, true);

        return Utils.removeNilValues<FxQuote>({
            fromCurrency: data.from,
            toCurrency: data.to,
            fromAmount,
            toAmount,
            feeAmount: fromAmountFee,
            rate: exchangeRate.rate,
            hash: exchangeRate.hash,
            feeRate: exchangeRate.fee,
            originalRate: exchangeRate.originalRate,
        });
    }

    async calculateTransactionFee(amount: number, type: string, round = false): Promise<number> {
        const feeSettings = await this.getFeesSettings(type);

        if (feeSettings?.structure == FeeStructure.Flat) {
            return feeSettings.value;
        }

        if (feeSettings?.structure == FeeStructure.Percentage) {
            const val = Big(feeSettings.value).div(100).times(amount);
            if (feeSettings.cap != 0 && val.toNumber() > feeSettings.cap) {
                return feeSettings.cap;
            }

            return round ? val.round(0).toNumber() : val.toNumber();
        }

        return 0;
    }

    async getFeesSettings(type: string): Promise<Fee> {
        const obj = await this.redisService.jsonGet<Record<string, Fee>>(RedisKeys.FeesSettings);
        return obj ? obj[type] : undefined;
    }
}

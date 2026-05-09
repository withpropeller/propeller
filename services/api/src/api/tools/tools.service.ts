import { Injectable } from '@nestjs/common';
import { Fee, FeeStructure } from '@api/fees/fee.schema';
import { RedisKeys } from '@core/helpers';
import { FloService, floDecodeJson } from '@core/services/flo.service';
import Big from 'big.js';

@Injectable()
export class ToolsService {
    constructor(private flo: FloService) {}

    async calculateTransactionFee(amount: number, type: string): Promise<number> {
        const feeSettings = await this.getFeesSettings(type);

        if (feeSettings?.structure == FeeStructure.Flat) {
            return feeSettings.value;
        }

        if (feeSettings?.structure == FeeStructure.Percentage) {
            const val = Big(feeSettings.value).div(100).times(amount);
            if (feeSettings.cap != 0 && val.toNumber() > feeSettings.cap) {
                return feeSettings.cap;
            }

            return val.toNumber();
        }

        return 0;
    }

    async getFeesSettings(type: string): Promise<Fee> {
        const obj = floDecodeJson<Record<string, Fee>>(
            (await this.flo.client.kv.jsonGet(RedisKeys.FeesSettings, '$'))?.value ?? null,
        );
        return obj ? obj[type] : undefined;
    }
}

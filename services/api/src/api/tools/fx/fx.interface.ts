import { TransactionCurrency } from '@api/transactions/transactions.enums';
import { MoneyAmount } from '@common/decorators/validators.decorators';
import { Utils } from '@core/helpers';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, Validate, IsBooleanString } from 'class-validator';

export enum FxQuoteType {
    Buy = 'buy', // if you know the amount you are getting it is a buy
    Sell = 'sell', // if you know the amount you are giving it is a sell
}

export interface FxRate {
    hash: string;
    from: 'USD' | 'NGN';
    to: 'USD' | 'NGN';
    rate: number;
    originalRate: number;
    fee?: number;
    lastUpdated?: Date;
}

export class CurrencyFromToDto {
    @ApiProperty()
    @IsEnum(TransactionCurrency)
    from: TransactionCurrency;

    @ApiProperty()
    @IsEnum(TransactionCurrency)
    to: TransactionCurrency;

    @ApiPropertyOptional()
    @IsOptional()
    @Transform((v) => Utils.safeNumber(v.value))
    @Validate(MoneyAmount)
    amount: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBooleanString()
    funding?: boolean;
}

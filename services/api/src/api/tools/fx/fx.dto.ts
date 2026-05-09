import { TransactionCurrency } from '@api/transactions/transactions.enums';
import { MoneyAmount } from '@common/decorators/validators.decorators';
import { Utils } from '@core/helpers';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, Validate } from 'class-validator';
import { FxQuoteType } from './fx.interface';

export class FxQuoteDto {
    @ApiPropertyOptional()
    @IsEnum(FxQuoteType)
    @IsOptional()
    type?: FxQuoteType;

    @ApiProperty()
    @IsEnum(TransactionCurrency)
    from: TransactionCurrency;

    @ApiProperty()
    @IsEnum(TransactionCurrency)
    to: TransactionCurrency;

    @ApiProperty()
    @Transform((v) => Utils.safeNumber(v.value))
    @Validate(MoneyAmount)
    amount: number;
}

export class FxBuyQuoteDto {
    @ApiProperty()
    @IsEnum(TransactionCurrency)
    fromCurrency: TransactionCurrency;

    @ApiProperty()
    @IsEnum(TransactionCurrency)
    toCurrency: TransactionCurrency;

    @ApiProperty()
    @Transform((v) => Utils.safeNumber(v.value))
    @Validate(MoneyAmount)
    toAmount: number;
}

export class FxSellQuoteDto {
    @ApiProperty()
    @IsEnum(TransactionCurrency)
    fromCurrency: TransactionCurrency;

    @ApiProperty()
    @IsEnum(TransactionCurrency)
    toCurrency: TransactionCurrency;

    @ApiProperty()
    @Transform((v) => Utils.safeNumber(v.value))
    @Validate(MoneyAmount)
    fromAmount: number;
}

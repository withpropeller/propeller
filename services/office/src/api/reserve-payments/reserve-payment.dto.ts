import { MoneyAmount, IsTagMap } from '@common/decorators/validators.decorators';
import { ModelIdTag, ParseTagMap, TagMap } from '@core/mongo';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
    IsEnum,
    IsNotEmptyObject,
    ValidateNested,
    Validate,
    IsString,
    IsOptional,
    Length,
    IsObject,
    ValidateIf,
    IsNotEmpty,
} from 'class-validator';
import { PayoutPaymentMethod } from '@api/payments/payment.enums';
import { TransactionCurrency } from '@api/transactions/transactions.enums';

export class PayoutPaymentOptionsDto {
    @ApiProperty({
        enum: PayoutPaymentMethod,
        example: PayoutPaymentMethod.BankTransfer,
    })
    @IsEnum(PayoutPaymentMethod)
    method: PayoutPaymentMethod;

    @ApiPropertyOptional()
    @IsString()
    @Length(10, 10)
    @ValidateIf((v) => v.method == PayoutPaymentMethod.BankTransfer)
    accountNumber: string;

    @ApiPropertyOptional()
    @IsString()
    @ValidateIf((v) => v.method == PayoutPaymentMethod.BankTransfer)
    @IsNotEmpty()
    bankCode: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    narration: string;

    @ApiPropertyOptional({
        enum: TransactionCurrency,
        example: TransactionCurrency.NGN,
    })
    @IsEnum(TransactionCurrency)
    @ValidateIf((v) => v.method == PayoutPaymentMethod.FxTransfer)
    fxCurrency: TransactionCurrency;

    @ApiPropertyOptional()
    @IsString()
    @ValidateIf((v) => v.method == PayoutPaymentMethod.FxTransfer)
    @IsNotEmpty()
    fxQuoteHash?: string;
}

export class CreatePayoutPaymentDto {
    @ApiProperty()
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => PayoutPaymentOptionsDto)
    options: PayoutPaymentOptionsDto;

    @ApiProperty({
        enum: TransactionCurrency,
        example: TransactionCurrency.NGN,
    })
    @IsEnum(TransactionCurrency)
    currency: TransactionCurrency;

    @ApiProperty({ example: 10000 })
    @Validate(MoneyAmount)
    amount: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    customer?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    reference?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    description?: string;

    @ApiProperty({ example: 'ac.rsv.2cbc123456' })
    @Transform((v) => ParseTagMap(v.value, [ModelIdTag.ReserveAccount]))
    @Validate(IsTagMap)
    debitSource: TagMap;

    @ApiPropertyOptional({ type: 'object', example: { key: 'value' } })
    @IsOptional()
    @IsObject()
    @IsNotEmptyObject()
    metadata?: Record<string, any>;
}

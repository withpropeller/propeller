import { MoneyAmount, IsTagMap } from '@common/decorators/validators.decorators';
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
    IsBoolean,
} from 'class-validator';
import { PaymentMethod } from './payment.enums';
import { TransactionCurrency } from '@api/transactions/transactions.enums';
import { ModelIdTag, ParseTagMap, TagMap } from '@core/mongo';

export class PayoutPaymentOptionsDto {
    @ApiPropertyOptional({
        enum: PaymentMethod,
        example: PaymentMethod.BankTransfer,
    })
    @IsEnum(PaymentMethod)
    @IsOptional()
    method: PaymentMethod;

    @ApiPropertyOptional()
    @IsString()
    @Length(10, 10)
    @ValidateIf((v) => v.method == PaymentMethod.BankTransfer)
    accountNumber: string;

    @ApiPropertyOptional()
    @IsString()
    @ValidateIf((v) => v.method == PaymentMethod.BankTransfer)
    @IsNotEmpty()
    bankCode: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    narration: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    note: string;

    @ApiProperty({ example: 'ac.2cbc123456' })
    @Transform((v) => ParseTagMap(v.value, [ModelIdTag.Account, ModelIdTag.Card]))
    @ValidateIf((v) => [PaymentMethod.FxTransfer, PaymentMethod.LocalTransfer].includes(v.method))
    @Validate(IsTagMap)
    destination: TagMap;

    @ApiPropertyOptional({
        enum: TransactionCurrency,
        example: TransactionCurrency.NGN,
    })
    @IsEnum(TransactionCurrency)
    @ValidateIf((v) => v.method == PaymentMethod.FxTransfer)
    fxCurrency: TransactionCurrency;

    @ApiPropertyOptional()
    @IsString()
    @ValidateIf((v) => v.method == PaymentMethod.FxTransfer)
    @IsNotEmpty()
    fxQuoteHash?: string;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    bypassDuplicateCheck?: boolean;
}

export class CreatePayoutPaymentDto {
    @ApiPropertyOptional({
        enum: PaymentMethod,
        example: PaymentMethod.BankTransfer,
    })
    @IsEnum(PaymentMethod)
    @IsOptional()
    method?: PaymentMethod;

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

    @ApiPropertyOptional({ example: 'fee.2cbc123456' })
    @Transform((v) => ParseTagMap(v.value, [ModelIdTag.Fee]))
    @Validate(IsTagMap)
    @IsOptional()
    fee?: TagMap;

    @ApiPropertyOptional({ example: 'ac.2cbc123456' })
    @Transform((v) => ParseTagMap(v.value, [ModelIdTag.Account, ModelIdTag.Card]))
    @Validate(IsTagMap)
    @IsOptional()
    debitSource?: TagMap;

    @ApiPropertyOptional({ type: 'object', example: { key: 'value' } })
    @IsOptional()
    @IsObject()
    @IsNotEmptyObject()
    metadata?: Record<string, any>;
}

export class GeneratePDFDto {
    @ApiPropertyOptional({
        description: 'Timezone',
        example: 'Africa/Lagos',
    })
    @IsNotEmpty()
    @IsOptional()
    @IsString()
    timezone: string;
}

import { Utils } from '@core/helpers';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    ArrayNotEmpty,
    IsArray,
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
    Validate,
    ValidateNested,
} from 'class-validator';
import { MoneyAmount } from '@common/decorators/validators.decorators';
import { FeeBreakdownType, FeeStructure } from '@api/fees/fee.schema';
import { TransactionProcessor, TransactionProcessorType } from '@api/transactions/transactions.enums';

export class AddFeeSettingsDto {
    @ApiProperty()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => FeeDto)
    fees: FeeDto[];
}

export class FeeDto {
    @ApiProperty()
    @IsEnum(FeeBreakdownType)
    type: FeeBreakdownType;

    @ApiProperty()
    @IsEnum(FeeStructure)
    structure: FeeStructure;

    @ApiProperty()
    @Transform((v) => Utils.safeNumber(v.value))
    @Validate(MoneyAmount)
    value: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Transform((v) => Utils.safeNumber(v.value))
    @Validate(MoneyAmount)
    cap: number;
}

export class UpdateFxRateDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    readonly from: 'USD' | 'NGN';

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    readonly to: 'USD' | 'NGN';

    @ApiProperty()
    @IsNumber()
    rate: number;
}

export class ProvidusSettlementRepushDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    readonly sessionId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    readonly settlementRef: string;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    readonly force: boolean;
}

export class TransferFeeTierDto {
    @IsNumber()
    limit: number;

    @IsNumber()
    fee: number;
}

export class UpdateTransferSettingsDto {
    @ApiProperty()
    @IsEnum(TransactionProcessor)
    readonly processor: TransactionProcessor;

    @ApiProperty()
    @IsEnum(TransactionProcessorType)
    readonly type: TransactionProcessorType;

    @ApiProperty()
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => TransferFeeTierDto)
    feeTiers: TransferFeeTierDto[];
}

export class TransactionCategoriesDto {
    @ApiProperty()
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    categories: string[];
}

export class AddTransactionMerchantDto {
    @ApiProperty()
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => TransactionMerchantDto)
    merchants: TransactionMerchantDto[];
}

export class TransactionMerchantPatternDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    prefix: string;

    @ApiProperty()
    @IsString({ each: true })
    @IsArray()
    @ArrayNotEmpty()
    keywords: string[];
}

export class TransactionMerchantDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    category: string;

    @ApiProperty()
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => TransactionMerchantPatternDto)
    patterns: TransactionMerchantPatternDto;

    @ApiProperty()
    @IsUrl()
    imageUrl: string;
}

export class HashSetDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    key: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    value: string;
}

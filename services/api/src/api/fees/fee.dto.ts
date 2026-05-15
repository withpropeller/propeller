import { MoneyAmount, IsTagId } from '@common/decorators/validators.decorators';
import { ModelIdTag, ParseTagId } from '@core/mongo';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, Validate, IsString, IsOptional, IsObject, IsNotEmptyObject, IsNotEmpty } from 'class-validator';
import { FeeStructure } from './fee.schema';
import { TransactionCurrency } from '@api/transactions/transactions.enums';
import { Types } from 'mongoose';

export class CreateFeeDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    description?: string;

    @ApiProperty({ enum: FeeStructure, example: FeeStructure.Flat })
    @IsEnum(FeeStructure)
    structure: FeeStructure;

    @ApiPropertyOptional({
        example: TransactionCurrency.NGN,
        enum: TransactionCurrency,
    })
    @IsEnum(TransactionCurrency)
    currency: TransactionCurrency;

    @ApiProperty({ example: 500 })
    @Validate(MoneyAmount)
    value: number;

    @ApiPropertyOptional({ example: 10000 })
    @IsOptional()
    @Validate(MoneyAmount)
    cap: number;

    @ApiProperty({ example: 'ac.2cbc123456' })
    @Transform((v) => ParseTagId(v.value, [ModelIdTag.Account]))
    @Validate(IsTagId)
    account: Types.ObjectId;

    @ApiPropertyOptional({ type: 'object', additionalProperties: true, example: { key: 'value' } })
    @IsOptional()
    @IsObject()
    @IsNotEmptyObject()
    metadata?: Record<string, any>;
}

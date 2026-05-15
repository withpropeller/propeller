import { IsTagMap } from '@common/decorators/validators.decorators';
import { ParseTagMap, ParseTagId, ModelIdTag, TagMap } from '@core/mongo';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsNotEmptyObject, Validate, IsString, IsNotEmpty, IsObject } from 'class-validator';
import { Types } from 'mongoose';

export class CreateBillPaymentDto {
    @ApiProperty({ example: 'bp.2cbc123456' })
    @Transform((v) => ParseTagId(v.value, [ModelIdTag.BillProduct]))
    @Validate(ParseTagId)
    product: Types.ObjectId;

    @ApiProperty()
    @IsObject()
    @IsNotEmptyObject()
    inputs: Record<string, string>;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    customer?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    reference?: string;

    @ApiPropertyOptional({ example: 'ac.2cbc123456' })
    @Transform((v) => ParseTagMap(v.value, [ModelIdTag.Account, ModelIdTag.Card]))
    @Validate(IsTagMap)
    @IsOptional()
    debitSource?: TagMap;

    @ApiPropertyOptional({ type: 'object', additionalProperties: true, example: { key: 'value' } })
    @IsOptional()
    @IsObject()
    @IsNotEmptyObject()
    metadata?: Record<string, any>;
}

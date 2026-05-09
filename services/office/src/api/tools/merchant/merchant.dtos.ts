import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    ArrayNotEmpty,
    ValidateNested,
    IsNotEmpty,
    IsString,
    IsUrl,
    IsOptional,
    IsNumberString,
    Length,
} from 'class-validator';

export class AddTransactionMerchantDto {
    @ApiProperty()
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => CreateMerchantDto)
    merchants: CreateMerchantDto[];
}

export class MerchantPatternDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    affix: string;

    @ApiProperty()
    @IsString({ each: true })
    @IsArray()
    @ArrayNotEmpty()
    keywords: string[];

    @ApiPropertyOptional()
    @IsString({ each: true })
    @IsArray()
    @IsOptional()
    @ArrayNotEmpty()
    samples?: string[];
}

export class MatchDescriptorPhraseDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    phrase: string;
}

export class CreateMerchantDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    incorporatedName: string;

    @ApiProperty()
    @IsNumberString()
    @Length(4, 4)
    mcc: string;

    @ApiProperty()
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => MerchantPatternDto)
    patterns: MerchantPatternDto[];

    @ApiPropertyOptional()
    @IsUrl()
    @IsOptional()
    iconUrl?: string;
}

export class UpdateMerchantDto {
    @ApiPropertyOptional()
    @IsNotEmpty()
    @IsOptional()
    @IsString()
    name: string;

    @ApiPropertyOptional()
    @IsNotEmpty()
    @IsOptional()
    @IsString()
    incorporatedName: string;

    @ApiPropertyOptional()
    @IsNumberString()
    @IsOptional()
    @Length(4, 4)
    mcc: string;

    @ApiPropertyOptional()
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => MerchantPatternDto)
    @IsOptional()
    patterns: MerchantPatternDto[];

    @ApiPropertyOptional()
    @IsUrl()
    @IsOptional()
    iconUrl?: string;
}

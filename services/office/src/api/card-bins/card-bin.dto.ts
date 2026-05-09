import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsEnum,
    MaxLength,
    IsNotEmpty,
    IsArray,
    ArrayMinSize,
    ArrayMaxSize,
    ValidateNested,
    Validate,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CardBinBankProvider, CardBinLength, CardBinProfileCodes, CardBinType } from './card-bin.enums';
import { CardNetwork, CardPartner } from '@api/cards/cards.enums';
import { IsTagId } from '@common/decorators/validators.decorators';
import { ModelIdTag, ParseTagId } from '@core/mongo';
import { Types } from 'mongoose';

export class CreateCardBinConfigDto {
    @ApiProperty({ example: CardPartner.Providus, enum: CardPartner })
    @IsEnum(CardPartner)
    partner: CardPartner;

    @ApiProperty({ example: CardBinProfileCodes.PavilionMastercardLive, enum: CardBinProfileCodes })
    @IsEnum(CardBinProfileCodes)
    profile: CardBinProfileCodes;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    partnerProfile: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    partnerAccessId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    partnerAccessKey: string;
}

export class CreateCardBinDto {
    @ApiProperty({ example: CardBinType.Dedicated, enum: CardBinType })
    @IsEnum(CardBinType)
    type: CardBinType;

    @ApiProperty()
    @IsString()
    @MaxLength(50)
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    description?: string;

    @ApiProperty({ example: CardNetwork.MasterCard, enum: CardNetwork })
    @IsEnum(CardNetwork)
    network: CardNetwork;

    @ApiProperty({ example: CardBinBankProvider.Providus, enum: CardBinBankProvider })
    @IsEnum(CardBinBankProvider)
    provider: CardBinBankProvider;

    @ApiProperty({ example: 'bz.2cbc123456', type: String })
    @Transform((v) => ParseTagId(v.value, [ModelIdTag.Business]))
    @Validate(IsTagId)
    business: Types.ObjectId;

    @ApiProperty({
        type: [String],
        example: ['5249103030000000', '5249103039999999'],
        description: 'Two-element [start, end] pair. binLength and bin are auto-derived if not provided.',
    })
    @IsArray()
    @ArrayMinSize(2)
    @ArrayMaxSize(2)
    @IsString({ each: true })
    binRange: string[];

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    binAccountNumber: string;

    @ApiProperty({ type: CreateCardBinConfigDto })
    @ValidateNested()
    @Type(() => CreateCardBinConfigDto)
    config: CreateCardBinConfigDto;
}

export class PatchCardBinDto {
    @ApiPropertyOptional()
    @IsString()
    @MaxLength(50)
    @IsOptional()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    description: string;

    @ApiPropertyOptional({ example: CardNetwork.Verve, enum: CardNetwork })
    @IsEnum(CardNetwork)
    @IsOptional()
    network?: CardNetwork;

    @ApiPropertyOptional({ example: CardBinBankProvider.Providus, enum: CardBinBankProvider })
    @IsEnum(CardBinBankProvider)
    @IsOptional()
    provider?: CardBinBankProvider;

    @ApiPropertyOptional({ example: CardBinLength.OneMillion, enum: CardBinLength })
    @IsOptional()
    @IsEnum(CardBinLength)
    binLength?: CardBinLength;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, Validate } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CardProgramPartner, CardProgramStatus } from './card-program.enums';
import { CardType } from '@api/cards/cards.enums';
import { TransactionCurrency } from '@api/transactions/transactions.enums';
import { ModelIdTag, ParseTagId } from '@core/mongo';
import { Types } from 'mongoose';
import { IsTagId } from '@common/decorators/validators.decorators';

export class ApproveCardProgramDto {
    @ApiProperty({ enum: CardProgramPartner, example: CardProgramPartner.Providus })
    @IsEnum(CardProgramPartner)
    public partner: CardProgramPartner;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    public partnerProfile: string;
}

export class UpdateCardProgramStatuesDto {
    @ApiProperty({ enum: CardProgramStatus, example: CardProgramStatus.Personalising })
    @IsEnum(CardProgramStatus)
    public status: CardProgramStatus;
}

export class CardProgramMetricsDto {
    @ApiProperty({
        description: 'Card program counts grouped by status',
        type: Object,
        example: { new: 5, live: 3, manufacturing: 2 },
    })
    byStatus: Record<string, number>;

    @ApiProperty({
        description: 'Card program counts grouped by network',
        type: Object,
        example: { verve: 6, mastercard: 4 },
    })
    byNetwork: Record<string, number>;

    @ApiProperty({ description: 'Total number of card programs', type: Number })
    total: number;
}

export class CreateTestCardProgramDto {
    @ApiProperty({ description: 'Card program name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'Card program description' })
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    description?: string;

    @ApiProperty({
        description: 'Card BIN ID — provides partner and network',
        example: 'c.bin.2cbc123456',
        type: String,
    })
    @Transform((v) => ParseTagId(v.value, [ModelIdTag.CardBin]))
    @Validate(IsTagId)
    bin: Types.ObjectId;

    @ApiProperty({ description: 'Card type', enum: CardType })
    @IsEnum(CardType)
    type: CardType;

    @ApiProperty({ description: 'Number of cards', type: Number, minimum: 1 })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    quantity: number;

    @ApiProperty({ description: 'Card currency', enum: TransactionCurrency })
    @IsEnum(TransactionCurrency)
    currency: TransactionCurrency;

    @ApiProperty({ description: 'Business ID', example: 'bz.2cbc123456', type: String })
    @Transform((v) => ParseTagId(v.value, [ModelIdTag.Business]))
    @Validate(IsTagId)
    business: Types.ObjectId;
}

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelIdTag, ModelSchemaOptions, enumProp, enumPropRequired } from '@core/mongo';
import { CardBinBankProvider, CardBinLength, CardBinProfileCodes, CardBinStatus, CardBinType } from './card-bin.enums';
import { CardNetwork, CardPartner } from '@api/cards/cards.enums';
import { ApiHydrated } from '@common/dtos';
import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Schema()
export class CardBinConfig {
    @Prop(enumPropRequired(CardPartner))
    @ApiProperty({ description: 'Payment card partner', enum: CardPartner })
    partner: CardPartner;

    @Prop(enumPropRequired(CardBinProfileCodes))
    @ApiProperty({ description: 'BIN profile code', enum: CardBinProfileCodes })
    profile: CardBinProfileCodes;

    @Prop()
    @ApiPropertyOptional({ description: 'Partner profile name' })
    partnerProfile?: string;

    @Prop()
    @ApiHideProperty()
    partnerAccessKey?: string;

    @Prop()
    @ApiHideProperty()
    partnerAccessId?: string;
}
export const CardProgramConfigSchema = SchemaFactory.createForClass(CardBinConfig);

@Schema(
    ModelSchemaOptions({
        tag: ModelIdTag.CardBin,
        pick: '-config.partnerAccessKey -config.partnerAccessId',
    }),
)
export class CardBin {
    @Prop({ length: 50, required: true })
    @ApiProperty({ description: 'BIN name' })
    name: string;

    @Prop({ default: CardBinType.Dedicated })
    @ApiProperty({ description: 'BIN type', enum: CardBinType })
    type: CardBinType;

    @Prop()
    @ApiPropertyOptional({ description: 'BIN description' })
    description: string;

    @Prop()
    @ApiProperty({ description: 'Hashed BIN value' })
    binHash: string;

    @Prop(enumPropRequired(CardNetwork))
    @ApiProperty({ description: 'Card network', enum: CardNetwork })
    network: CardNetwork;

    @Prop(enumPropRequired(CardBinBankProvider))
    @ApiProperty({ description: 'Bank provider', enum: CardBinBankProvider })
    provider: CardBinBankProvider;

    @Prop(enumPropRequired(CardBinLength))
    @ApiProperty({ description: 'BIN capacity', enum: CardBinLength })
    binLength: CardBinLength;

    @Prop({ type: [String] })
    @ApiProperty({ description: 'BIN range [start, end]', type: [String] })
    binRange: string[];

    @Prop()
    @ApiPropertyOptional({ description: 'Derived BIN prefix' })
    bin?: string;

    @Prop()
    @ApiPropertyOptional({ description: 'BIN account number' })
    binAccountNumber?: string;

    @Prop({ type: CardProgramConfigSchema, _id: false })
    @ApiPropertyOptional({ description: 'Partner configuration', type: CardBinConfig })
    config?: CardBinConfig;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Business',
        required: true,
    })
    @ApiProperty({ description: 'Business ID', type: String })
    business: any;

    @Prop(enumProp(CardBinStatus, CardBinStatus.New))
    @ApiProperty({ description: 'BIN status', enum: CardBinStatus })
    status: CardBinStatus;
}

export const CardBinSchema = SchemaFactory.createForClass(CardBin);
export const ApiHydratedCardBin = ApiHydrated(CardBin);

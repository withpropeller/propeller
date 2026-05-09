import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';
import { ModelIdTag, ModelSchemaOptions, Utils, enumProp, enumPropRequired } from '@core/helpers';
import { TransactionCurrency } from '@api/transactions/transactions.enums';
import { CardAuthorizationTimeoutDefault } from '@api/card-authorizations/card-authorization.schema';
import { CardProgramPartner, CardProgramProfileCodes, CardProgramStatus } from './card-program.enums';
import { CardNetwork, CardType } from '@api/cards/cards.enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiHydrated } from '@common/dtos';

export enum CardProgramDistributionType {
    Bulked = 'bulked',
    Individually = 'individually',
}

export enum CardProgramFundingSourceType {
    CardAccount = 'card-account',
    SettlementAccount = 'settlement-account',
}

@Schema()
export class ShippingAddress {
    @Prop()
    @ApiProperty({ description: 'City' })
    city: string;

    @Prop()
    @ApiProperty({ description: 'State' })
    state: string;

    @Prop()
    @ApiProperty({ description: 'ISO 3166-1 alpha-2 country code' })
    countryCode: string;

    @Prop()
    @ApiProperty({ description: 'Phone number' })
    phoneNumber: string;

    @Prop()
    @ApiProperty({ description: 'Primary address line' })
    addressLineOne: string;

    @Prop({ required: false })
    @ApiPropertyOptional({ description: 'Secondary address line' })
    addressLineTwo?: string;
}

export const ShippingAddressSchema = SchemaFactory.createForClass(ShippingAddress);

@Schema(
    ModelSchemaOptions({
        objectIds: ['settlementAccount:ac', 'webhook:wh'],
        timestamps: false,
    }),
)
export class CardProgramAuthorization {
    @Prop({
        type: String,
        enum: Utils.enumToArray(CardProgramFundingSourceType),
        default: CardProgramFundingSourceType.SettlementAccount,
    })
    @ApiPropertyOptional({ description: 'Funding source type', enum: CardProgramFundingSourceType })
    fundingSourceType?: CardProgramFundingSourceType;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Webhook' })
    @ApiPropertyOptional({ description: 'Webhook ID', type: String })
    webhook?: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
    @ApiPropertyOptional({ description: 'Settlement account ID', type: String })
    settlementAccount?: any;

    @Prop({
        type: String,
        enum: Utils.enumToArray(CardAuthorizationTimeoutDefault),
        default: CardAuthorizationTimeoutDefault.Decline,
    })
    @ApiPropertyOptional({ description: 'Timeout default action', enum: CardAuthorizationTimeoutDefault })
    timeoutDefault?: CardAuthorizationTimeoutDefault;
}
export const CardProgramAuthorizationSchema = SchemaFactory.createForClass(CardProgramAuthorization);

@Schema()
export class CardProgramDistribution {
    @Prop({
        type: String,
        enum: Utils.enumToArray(CardProgramDistributionType),
        required: true,
    })
    @ApiProperty({ description: 'Distribution type', enum: CardProgramDistributionType })
    type: CardProgramDistributionType;

    @Prop({ type: ShippingAddressSchema, _id: false })
    @ApiPropertyOptional({ description: 'Shipping address', type: ShippingAddress })
    shippingAddress: ShippingAddress;

    @Prop({ type: ShippingAddressSchema, _id: false })
    @ApiPropertyOptional({ description: 'Return address', type: ShippingAddress })
    returnAddress: ShippingAddress;
}
export const CardProgramDistributionSchema = SchemaFactory.createForClass(CardProgramDistribution);

@Schema()
export class CardProgramPersonalization {
    //@Prop()
    //templateId: string;

    // @Prop()
    //brandName: string;

    // @Prop()
    ///brandLogoFile: string;

    @Prop()
    @ApiPropertyOptional({ description: 'Front artwork file path/key' })
    frontArtworkFile: string;

    @Prop({ default: false })
    @ApiProperty({ description: 'Whether to print cardholder name on card', type: Boolean })
    printCardholderName: boolean;

    @Prop({ required: true })
    @ApiProperty({ description: 'Default cardholder name to emboss' })
    defaultCardholderName: string;
}
export const CardProgramPersonalizationSchema = SchemaFactory.createForClass(CardProgramPersonalization);

@Schema()
export class CardProgramConfig {
    @Prop(enumProp(CardProgramPartner))
    @ApiPropertyOptional({ description: 'Card program partner', enum: CardProgramPartner })
    partner?: CardProgramPartner;

    @Prop([String])
    @ApiPropertyOptional({ description: 'Partner card batch IDs', type: [String] })
    cardBatches?: string[];

    @Prop(enumProp(CardProgramProfileCodes))
    @ApiPropertyOptional({ description: 'Partner profile code', enum: CardProgramProfileCodes })
    profile: CardProgramProfileCodes;

    @Prop()
    @ApiPropertyOptional({ description: 'Partner profile identifier' })
    partnerProfile?: string;

    @Prop()
    @ApiPropertyOptional({ description: 'Partner access key' })
    partnerAccessKey: string;

    @Prop()
    @ApiPropertyOptional({ description: 'Partner access ID' })
    partnerAccessId: string;
}
export const CardProgramConfigSchema = SchemaFactory.createForClass(CardProgramConfig);

@Schema(
    ModelSchemaOptions({
        objectIds: ['business:bz'],
        tag: ModelIdTag.CardProgram,
    }),
)
export class CardProgram {
    @Prop({ length: 50, required: true })
    @ApiProperty({ description: 'Card program name' })
    name: string;

    @Prop()
    @ApiPropertyOptional({ description: 'Card program description' })
    description: string;

    @Prop({
        type: String,
        enum: Utils.enumToArray(CardNetwork),
        required: true,
    })
    @ApiProperty({ description: 'Card network', enum: CardNetwork })
    network: CardNetwork;

    @Prop(enumPropRequired(CardType))
    @ApiProperty({ description: 'Card type', enum: CardType })
    type: CardType;

    @Prop({ required: true })
    @ApiProperty({ description: 'Total number of cards to produce', type: Number })
    quantity: number;

    @Prop({
        type: String,
        enum: Utils.enumToArray(TransactionCurrency),
        required: true,
    })
    @ApiProperty({ description: 'Card currency', enum: TransactionCurrency })
    currency: TransactionCurrency;

    @Prop({ type: CardProgramPersonalizationSchema, _id: false, required: true })
    @ApiProperty({ description: 'Personalization settings', type: CardProgramPersonalization })
    personalization: CardProgramPersonalization;

    @Prop({ type: CardProgramDistributionSchema, _id: false, required: true })
    @ApiProperty({ description: 'Distribution settings', type: CardProgramDistribution })
    distribution: CardProgramDistribution;

    @Prop({ type: CardProgramAuthorizationSchema, _id: false, required: true })
    @ApiProperty({ description: 'Authorization settings', type: CardProgramAuthorization })
    authorization: CardProgramAuthorization;

    @Prop({ type: CardProgramConfigSchema, _id: false, required: true })
    @ApiPropertyOptional({ description: 'Partner config', type: CardProgramConfig })
    config?: CardProgramConfig;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CardBin' })
    @ApiPropertyOptional({ description: 'Card BIN ID', type: String })
    bin?: Types.ObjectId;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Business',
        required: true,
    })
    @ApiProperty({ description: 'Business ID', type: String })
    business: any;

    @Prop({
        type: String,
        enum: Utils.enumToArray(CardProgramStatus),
        default: CardProgramStatus.New,
    })
    @ApiProperty({ description: 'Card program status', enum: CardProgramStatus })
    status: CardProgramStatus;
}

export const CardProgramSchema = SchemaFactory.createForClass(CardProgram);
export const ApiHydratedCardProgram = ApiHydrated(CardProgram);

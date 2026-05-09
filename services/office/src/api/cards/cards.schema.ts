import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ModelIdTag, ModelSchemaOptions, Utils } from '@core/helpers';
import { Schema as MongooseSchema } from 'mongoose';
import { Exclude } from 'class-transformer';
import { TransactionChannels, TransactionCurrency } from '@api/transactions/transactions.enums';
import { ShippingAddress, ShippingAddressSchema } from '@api/card-program/card-program.schema';
import { CardNetwork, CardType } from './cards.enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiHydrated } from '@common/dtos';

export enum CardStatus {
    New = 'new',
    Inactive = 'inactive',
    Active = 'active',
    Blocked = 'blocked',
    Terminated = 'terminated',
}

export enum SpendingLimitFrequency {
    Daily = 'daily',
    Weekly = 'weekly',
    Monthly = 'monthly',
    Yearly = 'yearly',
}

export interface ICardAuthDetails {
    pan: string;
    cvv: string;
    expiry: string;
    pin?: string;
}

@Schema()
export class SpendingControlLimits {
    @Prop({ required: true })
    @ApiProperty({ description: 'Spending limit amount in lowest currency unit', type: Number })
    amount: number;

    @Prop({
        type: String,
        enum: Utils.enumToArray(SpendingLimitFrequency),
        required: true,
    })
    @ApiProperty({ description: 'Spending limit interval', enum: SpendingLimitFrequency })
    interval: SpendingLimitFrequency;

    @Prop({
        type: [{ type: String, enum: Utils.enumToArray(TransactionChannels) }],
        default: void 0,
    })
    @ApiPropertyOptional({ description: 'Allowed channels', type: [String] })
    channels?: TransactionChannels[];

    @Prop({ type: [String], default: void 0 })
    @ApiPropertyOptional({ description: 'Allowed categories', type: [String] })
    categories?: string[];

    @Prop({ type: [MongooseSchema.Types.ObjectId], default: void 0 })
    @ApiPropertyOptional({ description: 'Allowed merchant IDs', type: [String] })
    merchants?: string[];
}

export const SpendingControlLimitsSchema = SchemaFactory.createForClass(SpendingControlLimits);

@Schema()
export class CardControl {
    @Prop({ type: [String], default: void 0 })
    @ApiPropertyOptional({ description: 'Allowed MCC categories', type: [String] })
    allowedCategories?: string[];

    @Prop({ type: [String], default: void 0 })
    @ApiPropertyOptional({ description: 'Blocked MCC categories', type: [String] })
    blockedCategories?: string[];

    @Prop({
        type: [{ type: String, enum: Utils.enumToArray(TransactionChannels) }],
        default: void 0,
    })
    @ApiPropertyOptional({ description: 'Allowed channels', type: [String] })
    allowedChannels?: TransactionChannels[];

    @Prop({
        type: [{ type: String, enum: Utils.enumToArray(TransactionChannels) }],
        default: void 0,
    })
    @ApiPropertyOptional({ description: 'Blocked channels', type: [String] })
    blockedChannels?: TransactionChannels[];

    @Prop({ type: [MongooseSchema.Types.ObjectId], default: void 0 })
    @ApiPropertyOptional({ description: 'Allowed merchant IDs', type: [String] })
    allowedMerchants?: string[];

    @Prop({ type: [MongooseSchema.Types.ObjectId], default: void 0 })
    @ApiPropertyOptional({ description: 'Blocked merchant IDs', type: [String] })
    blockedMerchants?: string[];

    @Prop({
        type: [{ type: SpendingControlLimitsSchema }],
        _id: false,
        default: void 0,
    })
    @ApiPropertyOptional({ description: 'Spending limits', type: [SpendingControlLimits] })
    spendingLimits?: SpendingControlLimits[];
}
export const CardControlSchema = SchemaFactory.createForClass(CardControl);

@Schema()
export class CardDetails {
    @Prop({ length: 4, required: true })
    @ApiProperty({ description: 'Last 4 digits of card PAN' })
    last4: string;

    @Prop({ sparse: true })
    @ApiPropertyOptional({ description: 'Encrypted PAN' })
    pan?: string;

    @Prop({ unique: true, sparse: true })
    @ApiPropertyOptional({ description: 'Hashed PAN' })
    panHash?: string;

    @Prop({ length: 3 })
    @ApiPropertyOptional({ description: 'CVV' })
    cvv?: string;

    @Prop({ length: 5 })
    @ApiPropertyOptional({ description: 'Card expiry (MM/YY)' })
    expiry?: string;

    @Prop({ length: 10, unique: true, sparse: true })
    @ApiPropertyOptional({ description: 'Account number' })
    account?: string;

    @Prop({ unique: true, sparse: true })
    @ApiPropertyOptional({ description: 'External card ID' })
    id: string;

    @Prop({ required: true })
    @ApiProperty({ description: 'Card holder name' })
    cardHolderName: string;
}
export const CardDetailsSchema = SchemaFactory.createForClass(CardDetails);

@Schema()
export class CardShipping {
    @Prop({ type: ShippingAddressSchema, _id: false })
    @ApiPropertyOptional({ description: 'Shipping address', type: ShippingAddress })
    address: ShippingAddress;
}
export const CardShippingSchema = SchemaFactory.createForClass(CardShipping);

@Schema(
    ModelSchemaOptions({
        objectIds: ['business:bz', 'customer:cus', 'program:c.prg', 'fundingSource:ac'],
        pick: '-details.cvv -details.pan -details.panHash',
        tag: ModelIdTag.Card,
    }),
)
export class Card {
    @Prop()
    @ApiPropertyOptional({ description: 'Card reference' })
    reference: string;

    @Prop({
        type: String,
        enum: Utils.enumToArray(CardType),
        required: true,
    })
    @ApiProperty({ description: 'Card type', enum: CardType })
    type: CardType;

    @Prop({
        type: String,
        enum: Utils.enumToArray(CardNetwork),
        required: true,
    })
    @ApiProperty({ description: 'Card network', enum: CardNetwork })
    network: CardNetwork;

    @Prop({
        type: String,
        enum: Utils.enumToArray(CardStatus),
        default: CardStatus.New,
    })
    @ApiProperty({ description: 'Card status', enum: CardStatus })
    status: CardStatus;

    @Prop({
        type: String,
        enum: Utils.enumToArray(TransactionCurrency),
        required: true,
    })
    @ApiProperty({ description: 'Card currency', type: String })
    currency: TransactionCurrency;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer' })
    @ApiPropertyOptional({ description: 'Customer ID', type: String })
    customer?: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
    @ApiPropertyOptional({ description: 'Funding source account ID', type: String })
    fundingSource?: any;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'CardProgram',
        required: true,
    })
    @ApiProperty({ description: 'Card program ID', type: String })
    program: any;

    @Prop({ type: CardControlSchema, _id: false })
    @ApiPropertyOptional({ description: 'Card spending controls', type: CardControl })
    controls?: CardControl;

    @Prop({ type: CardShippingSchema, _id: false })
    @ApiPropertyOptional({ description: 'Card shipping details', type: CardShipping })
    shipping?: CardShipping;

    @Prop(raw({}))
    @ApiPropertyOptional({ description: 'Additional metadata', type: Object })
    metadata?: Record<string, any>;

    @Exclude()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Business',
        required: true,
    })
    business: any;

    @Prop({ type: CardDetailsSchema, _id: false, required: true })
    @ApiProperty({ description: 'Card details', type: CardDetails })
    details: CardDetails;
}

export const CardSchema = SchemaFactory.createForClass(Card);
CardSchema.index(
    { business: 1, reference: 1 },
    { unique: true, partialFilterExpression: { reference: { $exists: true } } },
);
export const ApiHydratedCard = ApiHydrated(Card);

import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ModelIdTag, ModelSchemaOptions, Utils } from '@core/helpers';
import { Schema as MongooseSchema } from 'mongoose';
import { Exclude } from 'class-transformer';
import { NetworkDataSchema, NetworkData } from '@api/card-authorizations/card-authorization.schema';
import { TransactionChannels } from '@api/transactions/transactions.enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiHydrated } from '@common/dtos';

export enum CardTransactionStatus {
    Pending = 'pending',
    Success = 'success',
    Abandoned = 'abandoned',
}

export enum CardTransactionType {
    Capture = 'capture',
    Reversal = 'reversal',
    PartialCapture = 'partial-capture',
    OverCapture = 'over-capture',
    Cancel = 'cancel-capture',
}

@Schema(
    ModelSchemaOptions({
        objectIds: [
            'business:bz',
            'card:c',
            'merchant:mch',
            'authorization:c.auth',
            'customer:cus',
            'dispute:d',
            'source:#sourceRef',
            'reversedBy:c.txn',
            'reversalOf:c.txn',
        ],
        pick: '-networkData.requests -networkData.partner -sourceRef',
        tag: ModelIdTag.CardTransaction,
    }),
)
export class CardTransaction {
    @Prop({ required: true })
    @ApiProperty({ description: 'Transaction amount in lowest currency unit', type: Number })
    amount: number;

    @Prop({ default: 0 })
    @ApiProperty({ description: 'Fees charged in lowest currency unit', type: Number })
    fees: number;

    @Prop({ type: String, enum: Utils.enumToArray(TransactionChannels) })
    @ApiPropertyOptional({ description: 'Transaction channel', enum: TransactionChannels })
    channel: TransactionChannels;

    @Prop({ required: true, enum: Utils.enumToArray(CardTransactionStatus) })
    @ApiProperty({ description: 'Transaction status', enum: CardTransactionStatus })
    status: CardTransactionStatus;

    @Prop({ required: true, enum: Utils.enumToArray(CardTransactionType) })
    @ApiProperty({ description: 'Transaction type', enum: CardTransactionType })
    type: CardTransactionType;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'CardAuthorization',
        required: true,
    })
    @ApiPropertyOptional({ description: 'Card authorization ID', type: String })
    authorization?: any;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        refPath: 'sourceRef',
        required: true,
    })
    @ApiProperty({ description: 'Source document ID', type: String })
    source: any;

    @Prop({ type: String, required: true })
    @ApiProperty({ description: 'Source model reference name' })
    sourceRef: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Card', required: true })
    @ApiPropertyOptional({ description: 'Card ID', type: String })
    card?: any;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Merchant',
        required: true,
    })
    @ApiPropertyOptional({ description: 'Merchant ID', type: String })
    merchant?: any;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    })
    @ApiPropertyOptional({ description: 'Customer ID', type: String })
    customer?: any;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Account',
        required: true,
    })
    @ApiPropertyOptional({ description: 'Funding source account ID', type: String })
    fundingSource?: any;

    @Prop(raw({}))
    @ApiPropertyOptional({ description: 'Additional metadata', type: Object })
    metadata?: Record<string, any>;

    @Prop({ type: NetworkDataSchema, _id: false, required: true })
    @ApiProperty({ description: 'Network data from card scheme', type: NetworkData })
    networkData: NetworkData;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Dispute' })
    @ApiPropertyOptional({ description: 'Dispute ID', type: String })
    dispute?: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CardTransaction' })
    @ApiPropertyOptional({ description: 'Card transaction that reversed this one', type: String })
    reversedBy?: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CardTransaction' })
    @ApiPropertyOptional({ description: 'Card transaction this is a reversal of', type: String })
    reversalOf?: any;

    @Exclude()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Business',
        required: true,
    })
    @ApiProperty({ description: 'Business ID', type: String })
    business: any;
}

export const CardTransactionSchema = SchemaFactory.createForClass(CardTransaction);
export const ApiHydratedCardTransaction = ApiHydrated(CardTransaction);

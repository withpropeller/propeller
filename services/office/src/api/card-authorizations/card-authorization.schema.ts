import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ModelIdTag, ModelSchemaOptions, Utils } from '@core/helpers';
import { Schema as MongooseSchema } from 'mongoose';
import { Exclude } from 'class-transformer';
import { TransactionChannels, TransactionCurrency } from '@api/transactions/transactions.enums';
import { enumPropRequired } from '@core/mongo';
import { CardAuthTimelineAction } from './card-authorization.enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiHydrated } from '@common/dtos';

export enum NetworkDataRequestType {
    Enquiry = 'enquiry',
    Debit = 'debit',
    PlaceLien = 'place-lien',
    DebitLien = 'debit-lien',
    Reversal = 'reversal',
}

export enum CardAuthorizationTimeoutDefault {
    Approve = 'approve',
    Decline = 'decline',
}

export enum CardAuthorizationType {
    Capture = 'capture',
    Check = 'check',
}

export enum CardAuthorizationStatus {
    Pending = 'pending',
    Approved = 'approved',
    Declined = 'declined',
    Reversed = 'reversed',
}

export enum CardAuthorizationDeclineReason {
    InsufficientFunds = 'insufficient-funds', // direct or system
    AccountInactive = 'account-inactive', // direct or system
    AccountNotFound = 'account-not-found', // direct or system
    SpendingControl = 'spending-control', // direct or system
    TimeoutDefault = 'timeout-default', //system
    InvalidTransaction = 'invalid-transaction', // direct or system
    SystemFailure = 'system-failure', // system
    InvalidResponse = 'invalid-response', // system
    AuthDeclined = 'authorization-declined', // direct
}

export enum CardAuthorizationDecisionType {
    Direct = 'direct-response',
    System = 'system-response',
}

@Schema(
    ModelSchemaOptions({
        objectIds: ['balanceLog:bal.h'],
        timestamps: false,
    }),
)
export class CardAuthTimelineData {
    @Prop()
    @ApiPropertyOptional({ description: 'Response code' })
    code?: string;

    @Prop()
    @ApiPropertyOptional({ description: 'Error message' })
    error?: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'BalanceHistory' })
    @ApiPropertyOptional({ description: 'Balance history log ID', type: String })
    balanceLog?: any;
}
export const CardAuthTimelineDataSchema = SchemaFactory.createForClass(CardAuthTimelineData);

@Schema()
export class CardAuthTimeline {
    @Prop(enumPropRequired(CardAuthTimelineAction))
    @ApiProperty({ description: 'Timeline action', enum: CardAuthTimelineAction })
    action: string;

    @Prop({ type: CardAuthTimelineDataSchema, _id: false })
    @ApiPropertyOptional({ description: 'Timeline action data', type: CardAuthTimelineData })
    data?: CardAuthTimelineData;

    @Prop(enumPropRequired(CardAuthorizationStatus))
    @ApiProperty({ description: 'Authorization status at this point', enum: CardAuthorizationStatus })
    status: CardAuthorizationStatus;

    @Prop({ required: true })
    @ApiProperty({ description: 'Timeline entry timestamp', type: Date })
    createdAt: Date;
}
export const CardAuthTimelineSchema = SchemaFactory.createForClass(CardAuthTimeline);

@Schema()
export class NetworkDataRequests {
    @Prop({
        type: String,
        enum: Utils.enumToArray(NetworkDataRequestType),
    })
    @ApiProperty({ description: 'Network request type', enum: NetworkDataRequestType })
    type: NetworkDataRequestType;

    @Prop(raw({}))
    @ApiPropertyOptional({ description: 'Raw request body' })
    requestBody?: Record<string, any>;

    @Prop(raw({}))
    @ApiPropertyOptional({ description: 'Raw response body' })
    responseBody?: Record<string, any>;
}
export const NetworkDataRequestsSchema = SchemaFactory.createForClass(NetworkDataRequests);

@Schema()
export class NetworkData {
    @Prop()
    @ApiProperty({ description: 'Card network name' })
    network: string;

    @Prop()
    @ApiProperty({ description: 'Network partner name' })
    partner: string;

    @Prop({ required: true })
    @ApiProperty({ description: 'Card acceptor name and location' })
    cardAcceptorNameLocation: string;

    @Prop()
    @ApiPropertyOptional({ description: 'System trace audit number' })
    stan: string;

    @Prop()
    @ApiPropertyOptional({ description: 'Retrieval reference number' })
    rrn: string;

    @Prop({ required: true })
    @ApiProperty({ description: 'Network transaction reference' })
    reference: string;

    @Prop()
    @ApiPropertyOptional({ description: 'Terminal ID' })
    terminalId: string;

    @Prop()
    @ApiPropertyOptional({ description: 'Merchant ID' })
    merchantId: string;

    @Exclude()
    @Prop({ type: [{ type: NetworkDataRequestsSchema }], default: void 0, _id: false })
    requests?: NetworkDataRequests[];
}
export const NetworkDataSchema = SchemaFactory.createForClass(NetworkData);

@Schema(
    ModelSchemaOptions({
        objectIds: [
            'business:bz',
            'card:c',
            'merchant:mch',
            'transactions:c.txn',
            'events:evt',
            'program:c.prg',
            'customer:cus',
        ],
        tag: ModelIdTag.CardAuthorization,
    }),
)
export class CardAuthorization {
    @Prop({
        type: String,
        enum: Utils.enumToArray(CardAuthorizationStatus),
        default: CardAuthorizationStatus.Pending,
    })
    @ApiProperty({ description: 'Authorization status', enum: CardAuthorizationStatus })
    status: CardAuthorizationStatus;

    @Prop({
        type: String,
        enum: Utils.enumToArray(CardAuthorizationDecisionType),
        default: CardAuthorizationDecisionType.System,
    })
    @ApiPropertyOptional({ description: 'Decision type', enum: CardAuthorizationDecisionType })
    decisionType?: string;

    @Prop({
        type: String,
        enum: Utils.enumToArray(CardAuthorizationDeclineReason),
    })
    @ApiPropertyOptional({ description: 'Decline reason', enum: CardAuthorizationDeclineReason })
    declineReason?: CardAuthorizationDeclineReason;

    @Prop({
        type: String,
        enum: Utils.enumToArray(CardAuthorizationType),
        required: true,
    })
    @ApiProperty({ description: 'Authorization type', enum: CardAuthorizationType })
    type: CardAuthorizationType;

    @Prop({ required: true })
    @ApiProperty({ description: 'Authorization amount in lowest currency unit', type: Number })
    amount: number;

    @Prop({ default: 0 })
    @ApiProperty({ description: 'Fees in lowest currency unit', default: 0, type: Number })
    fees: number;

    @Prop({
        type: String,
        enum: Utils.enumToArray(TransactionCurrency),
        required: true,
    })
    @ApiProperty({ description: 'Authorization currency', enum: TransactionCurrency })
    currency: TransactionCurrency;

    @Prop({ type: String, enum: Utils.enumToArray(TransactionChannels) })
    @ApiPropertyOptional({ description: 'Transaction channel', enum: TransactionChannels })
    channel: TransactionChannels;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Card' })
    @ApiPropertyOptional({ description: 'Card ID', type: String })
    card?: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CardProgram' })
    @ApiProperty({ description: 'Card program ID', type: String })
    program: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Merchant' })
    @ApiPropertyOptional({ description: 'Merchant ID', type: String })
    merchant?: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer' })
    @ApiPropertyOptional({ description: 'Customer ID', type: String })
    customer?: any;

    @Prop(raw({}))
    @ApiPropertyOptional({ description: 'Additional metadata' })
    metadata?: Record<string, any>;

    @Prop({ type: NetworkDataSchema, _id: false, required: true })
    @ApiProperty({ description: 'Network transaction data', type: NetworkData })
    networkData: NetworkData;

    @Prop({
        type: [{ type: MongooseSchema.Types.ObjectId, ref: 'CardTransaction' }],
        default: void 0,
    })
    @ApiPropertyOptional({ description: 'Related card transaction IDs', type: [String] })
    transactions?: any[];

    @Prop({
        type: [{ type: CardAuthTimelineSchema }],
        _id: false,
        default: void 0,
    })
    @ApiPropertyOptional({ description: 'Authorization timeline', type: [CardAuthTimeline] })
    timeline: CardAuthTimeline[];

    @Prop({
        type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Event' }],
        default: void 0,
    })
    @ApiPropertyOptional({ description: 'Related event IDs', type: [String] })
    events?: any[];

    @Exclude()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Business',
        required: true,
    })
    business: any;
}

export const CardAuthorizationSchema = SchemaFactory.createForClass(CardAuthorization);
export const ApiHydratedCardAuthorization = ApiHydrated(CardAuthorization);

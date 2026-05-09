import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { enumPropRequired, ModelIdTag, ModelSchemaOptions, Utils } from '@core/helpers';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { Exclude } from 'class-transformer';
import { TransactionCurrency, TransactionProcessor } from '@api/transactions/transactions.enums';
import { FeeBreakdownSchema, FeeBreakdown, FeeBreakdownType } from '@api/fees/fee.schema';
import {
    PaymentStatus,
    PaymentFailureReason,
    PaymentType,
    PayoutPaymentMethod,
    PaymentMethodChargeType,
    PaymentTimelineDataCode,
    PaymentTimelineAction,
} from './payment.enums';
import { FeeGroup } from '@api/fees/fee.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiHydrated } from '@common/dtos';

export interface PaymentEnvoyResponse {
    status: string;
}

@Schema()
export class ProcessorData {
    @Prop({ unique: true, sparse: true })
    @ApiPropertyOptional({ description: 'Processor reference' })
    reference: string;

    @Prop()
    @ApiPropertyOptional({ description: 'Session ID' })
    sessionId: string;

    @Prop()
    @ApiPropertyOptional({ description: 'Whether the transaction was validated', type: Boolean })
    validated: boolean;

    @Prop()
    @ApiPropertyOptional({ description: 'Marked as not found by processor', type: Boolean })
    markedAsNotFound: boolean;

    @Prop()
    @ApiPropertyOptional({ description: 'Marked as debited by processor', type: Boolean })
    markedAsDebited: boolean;

    @Prop()
    @ApiPropertyOptional({ description: 'Marked as reversed by processor', type: Boolean })
    markedAsReversed: boolean;

    @Prop()
    @ApiPropertyOptional({ description: 'Raw processor response body' })
    rawBody?: string;

    @Prop()
    @ApiPropertyOptional({ description: 'Number of transaction query attempts', type: Number })
    txnQueryAttempts?: number;

    @Prop()
    @ApiPropertyOptional({ description: 'Next scheduled transaction query time', type: Date })
    txnQueryRetryAt?: Date;
}
export const ProcessorDataSchema = SchemaFactory.createForClass(ProcessorData);

@Schema(
    ModelSchemaOptions({
        objectIds: ['product:bp'],
        timestamps: false,
    }),
)
export class BillingPaymentMethodData {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'BillProduct',
        required: true,
    })
    @ApiProperty({ description: 'Bill product ID', type: String })
    product: any;

    @Prop({ required: true })
    @ApiProperty({ description: 'Recipient reference' })
    recipientRef: string;

    @Prop({ type: MongooseSchema.Types.Mixed, required: true })
    @ApiProperty({ description: 'Billing input fields' })
    inputs: Record<string, any>;

    @Prop()
    @ApiPropertyOptional({ description: 'Commission amount', type: Number })
    commission: number;
}
export const BillPaymentMethodDataSchema = SchemaFactory.createForClass(BillingPaymentMethodData);

@Schema(
    ModelSchemaOptions({
        objectIds: ['destination:ac'],
        timestamps: false,
    }),
)
export class LocalTransferPaymentMethodData {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
    @ApiPropertyOptional({ description: 'Destination account ID', type: String })
    destination?: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
    @ApiPropertyOptional({ description: 'Source account ID', type: String })
    source?: any;

    @Prop()
    @ApiPropertyOptional({ description: 'Transfer note' })
    note?: string;
}
export const LocalTransferPaymentMethodDataSchema = SchemaFactory.createForClass(LocalTransferPaymentMethodData);

@Schema()
export class BankTransferPaymentMethodData {
    @Prop({ required: true })
    @ApiProperty({ description: 'Bank code' })
    bankCode: string;

    @Prop()
    @ApiPropertyOptional({ description: 'Bank name' })
    bankName?: string;

    @Prop({ required: true })
    @ApiProperty({ description: 'Destination account number' })
    accountNumber: string;

    @Prop()
    @ApiPropertyOptional({ description: 'Destination account name' })
    accountName?: string;

    @Prop()
    @ApiPropertyOptional({ description: 'Transfer narration' })
    narration: string;
}
export const BankTransferPaymentMethodDataSchema = SchemaFactory.createForClass(BankTransferPaymentMethodData);

@Schema(
    ModelSchemaOptions({
        objectIds: ['destination:#destinationRef', 'destinationAccount:ac'],
        pick: '-destinationRef -quoteRef',
        timestamps: false,
    }),
)
export class FxLocalTransferPaymentMethodData {
    @Prop({ required: true })
    @ApiProperty({ description: 'FX transfer amount', type: Number })
    amount: number;

    @Prop({ required: true })
    @ApiProperty({ description: 'Exchange rate', type: Number })
    rate: number;

    @Prop({
        type: String,
        enum: Utils.enumToArray(TransactionCurrency),
        required: true,
    })
    @ApiProperty({ description: 'Destination currency', enum: TransactionCurrency })
    currency: TransactionCurrency;

    @Prop({ required: true })
    @ApiProperty({ description: 'FX quote hash' })
    quoteHash: string;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        refPath: 'destinationRef',
        required: true,
    })
    @ApiProperty({ description: 'Destination document ID', type: String })
    destination: any;

    @Prop({ type: String, required: true })
    @ApiProperty({ description: 'Destination model reference name' })
    destinationRef: string;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Account',
        required: true,
    })
    @ApiProperty({ description: 'Destination account ID', type: String })
    destinationAccount: any;
}
export const FxLocalTransferPaymentMethodDataSchema = SchemaFactory.createForClass(FxLocalTransferPaymentMethodData);

@Schema(
    ModelSchemaOptions({
        objectIds: ['for:#forRef'],
        pick: '-forRef',
        timestamps: false,
    }),
)
export class ForceChargePaymentMethodData {
    @Prop({ type: String })
    @ApiPropertyOptional({ description: 'Force charge remarks' })
    remarks?: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, refPath: 'forRef' })
    @ApiPropertyOptional({ description: 'Related document ID', type: String })
    for?: any;

    @Prop({ type: String })
    @ApiPropertyOptional({ description: 'Related model reference name' })
    forRef: string;
}
export const ForceChargePaymentMethodDataSchema = SchemaFactory.createForClass(ForceChargePaymentMethodData);

@Schema(
    ModelSchemaOptions({
        objectIds: ['for:#forRef'],
        pick: '-forRef',
        timestamps: false,
    }),
)
export class RefundPaymentMethodData {
    @Prop({ type: String })
    @ApiPropertyOptional({ description: 'Refund remarks' })
    remarks?: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, refPath: 'forRef' })
    @ApiPropertyOptional({ description: 'Related document ID', type: String })
    for?: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Dispute' })
    @ApiPropertyOptional({ description: 'Dispute ID', type: String })
    dispute?: any;

    @Prop({ type: String })
    @ApiPropertyOptional({ description: 'Related model reference name' })
    forRef: string;
}
export const RefundPaymentMethodDataSchema = SchemaFactory.createForClass(RefundPaymentMethodData);

@Schema(
    ModelSchemaOptions({
        objectIds: ['for:#forRef'],
        pick: '-forRef',
        timestamps: false,
    }),
)
export class FxChargePaymentMethodData {
    @Prop({
        type: String,
        enum: Utils.enumToArray(PaymentMethodChargeType),
        required: true,
    })
    @ApiProperty({ description: 'FX charge type', enum: PaymentMethodChargeType })
    type: PaymentMethodChargeType;

    @Prop({ required: true })
    @ApiProperty({ description: 'Charge amount', type: Number })
    amount: number;

    @Prop({ required: true })
    @ApiProperty({ description: 'Exchange rate', type: Number })
    rate: number;

    @Prop({
        type: String,
        enum: Utils.enumToArray(TransactionCurrency),
        required: true,
    })
    @ApiProperty({ description: 'Charge currency', enum: TransactionCurrency })
    currency: TransactionCurrency;

    @Prop({ type: MongooseSchema.Types.ObjectId, refPath: 'forRef' })
    @ApiPropertyOptional({ description: 'Related document ID', type: String })
    for?: any;

    @Prop({ type: String })
    @ApiPropertyOptional({ description: 'Related model reference name' })
    forRef: string;
}
export const FxChargePaymentMethodDataSchema = SchemaFactory.createForClass(FxChargePaymentMethodData);

@Schema()
export class FxQuote {
    @Prop({ type: String })
    @ApiProperty({ description: 'Source currency', enum: TransactionCurrency })
    fromCurrency: TransactionCurrency;

    @Prop({ type: String })
    @ApiProperty({ description: 'Destination currency', enum: TransactionCurrency })
    toCurrency: TransactionCurrency;

    @Prop({ type: Number })
    @ApiProperty({ description: 'Source amount', type: Number })
    fromAmount: number;

    @Prop({ type: Number })
    @ApiProperty({ description: 'Destination amount', type: Number })
    toAmount: number;

    @Prop({ type: String })
    @ApiPropertyOptional({ description: 'Quote hash' })
    hash?: string;

    @Prop({ type: Number })
    @ApiProperty({ description: 'Exchange rate', type: Number })
    rate: number;

    @Prop({ type: Number })
    @ApiProperty({ description: 'Fee rate', type: Number })
    feeRate: number;

    @Prop({ type: Number })
    @ApiPropertyOptional({ description: 'Fee amount', type: Number })
    feeAmount?: number;

    @Prop({ type: Number })
    @ApiPropertyOptional({ description: 'Original exchange rate before markup', type: Number })
    originalRate?: number;
}

export const FxQuoteSchema = SchemaFactory.createForClass(FxQuote);

@Schema(
    ModelSchemaOptions({
        objectIds: ['for:#forRef'],
        pick: '-forRef',
        timestamps: false,
    }),
)
export class FxRefundPaymentMethodData {
    @Prop({ type: String })
    @ApiPropertyOptional({ description: 'Refund currency' })
    currency: string;

    @Prop({ type: Number })
    @ApiPropertyOptional({ description: 'Refund amount', type: Number })
    amount: number;

    @Prop({ type: String })
    @ApiPropertyOptional({ description: 'FX quote hash' })
    hash: string;

    @Prop({ type: Number })
    @ApiPropertyOptional({ description: 'Exchange rate', type: Number })
    rate: number;

    @Prop({ type: MongooseSchema.Types.ObjectId, refPath: 'forRef' })
    @ApiPropertyOptional({ description: 'Related document ID', type: String })
    for?: any;

    @Prop({ type: String })
    @ApiPropertyOptional({ description: 'Related model reference name' })
    forRef: string;

    @Prop({ type: FxQuoteSchema, _id: false })
    @ApiPropertyOptional({ description: 'FX quote details', type: FxQuote })
    fxQuote: FxQuote;

    @Prop({ type: String })
    @ApiPropertyOptional({ description: 'Refund type' })
    type: string;
}
export const FxRefundPaymentMethodDataSchema = SchemaFactory.createForClass(FxRefundPaymentMethodData);

@Schema(
    ModelSchemaOptions({
        objectIds: ['billing:bil'],
        timestamps: false,
    }),
)
export class BillingChargePaymentMethodData {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Billing' })
    @ApiProperty({ description: 'Billing ID', type: String })
    billing: any;
}
export const BillingChargePaymentMethodDataSchema = SchemaFactory.createForClass(BillingChargePaymentMethodData);

@Schema()
export class PaymentMethodData {
    @Prop({ type: BankTransferPaymentMethodDataSchema, _id: false })
    @ApiPropertyOptional({ description: 'Bank transfer method data', type: BankTransferPaymentMethodData })
    bankTransfer?: BankTransferPaymentMethodData;

    @Prop({ type: FxLocalTransferPaymentMethodDataSchema, _id: false })
    @ApiPropertyOptional({ description: 'FX local transfer method data', type: FxLocalTransferPaymentMethodData })
    fxLocalTransfer?: FxLocalTransferPaymentMethodData;

    @Prop({ type: FxChargePaymentMethodDataSchema, _id: false })
    @ApiPropertyOptional({ description: 'FX charge method data', type: FxChargePaymentMethodData })
    fxCharge?: FxChargePaymentMethodData;

    @Prop({ type: BillingChargePaymentMethodDataSchema, _id: false })
    @ApiPropertyOptional({ description: 'Billing charge method data', type: BillingChargePaymentMethodData })
    billingCharge?: BillingChargePaymentMethodData;

    @Prop({ type: FxRefundPaymentMethodDataSchema, _id: false })
    @ApiPropertyOptional({ description: 'FX refund method data', type: FxRefundPaymentMethodData })
    fxRefund?: FxRefundPaymentMethodData;

    @Prop({ type: ForceChargePaymentMethodDataSchema, _id: false })
    @ApiPropertyOptional({ description: 'Force charge method data', type: ForceChargePaymentMethodData })
    forceCharge?: ForceChargePaymentMethodData;

    @Prop({ type: RefundPaymentMethodDataSchema, _id: false })
    @ApiPropertyOptional({ description: 'Refund method data', type: RefundPaymentMethodData })
    refund?: RefundPaymentMethodData;

    @Prop({ type: BillPaymentMethodDataSchema, _id: false })
    @ApiPropertyOptional({ description: 'Billing method data', type: BillingPaymentMethodData })
    billing?: BillingPaymentMethodData;

    @Prop({ type: LocalTransferPaymentMethodDataSchema, _id: false })
    @ApiPropertyOptional({ description: 'Local transfer method data', type: LocalTransferPaymentMethodData })
    localTransfer?: LocalTransferPaymentMethodData;
}
export const PaymentMethodDataSchema = SchemaFactory.createForClass(PaymentMethodData);

@Schema(
    ModelSchemaOptions({
        objectIds: ['balanceLog:bal.h'],
        timestamps: false,
    }),
)
export class PaymentTimelineData {
    @Prop(enumPropRequired(PaymentTimelineDataCode))
    @ApiPropertyOptional({ description: 'Timeline data code', enum: PaymentTimelineDataCode })
    code?: string;

    @Prop()
    @ApiPropertyOptional({ description: 'Error message' })
    error?: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'BalanceHistory' })
    @ApiPropertyOptional({ description: 'Balance history log ID', type: String })
    balanceLog?: any;
}
export const PaymentTimelineDataSchema = SchemaFactory.createForClass(PaymentTimelineData);

@Schema()
export class PaymentTimeline {
    @Prop(enumPropRequired(PaymentTimelineAction))
    @ApiProperty({ description: 'Timeline action', enum: PaymentTimelineAction })
    action: PaymentTimelineAction;

    @Prop({ type: PaymentTimelineDataSchema, _id: false })
    @ApiPropertyOptional({ description: 'Timeline action data', type: PaymentTimelineData })
    data?: PaymentTimelineData;

    @Prop(enumPropRequired(PaymentStatus))
    @ApiProperty({ description: 'Payment status at this point', enum: PaymentStatus })
    status: PaymentStatus;

    @Prop({ required: true })
    @ApiProperty({ description: 'Timeline entry timestamp', type: Date })
    createdAt: Date;
}
export const PaymentTimelineSchema = SchemaFactory.createForClass(PaymentTimeline);

@Schema(
    ModelSchemaOptions({
        objectIds: [
            'business:bz',
            'customer:cus',
            'fundingSource:#fundingSourceRef',
            'source:#sourceRef',
            'account:ac',
            'events:evt',
        ],
        pick: '-fundingSourceRef -sourceRef -feesBreakdown -methodData_backup',
        tag: ModelIdTag.Payment,
    }),
)
export class Payment {
    @Prop({ required: true })
    @ApiProperty({ description: 'Payment amount in lowest currency unit', type: Number })
    amount: number;

    @Prop()
    @ApiPropertyOptional({ description: 'Payment reference' })
    reference: string;

    @Prop({
        type: String,
        enum: Utils.enumToArray(TransactionCurrency),
        required: true,
    })
    @ApiProperty({ description: 'Payment currency', enum: TransactionCurrency })
    currency: TransactionCurrency;

    @Prop({
        type: String,
        enum: Utils.enumToArray(PaymentStatus),
        default: PaymentStatus.New,
    })
    @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
    status: PaymentStatus;

    @Prop({ default: false })
    @ApiProperty({ description: 'Whether payment has been validated', default: false, type: Boolean })
    validated: boolean;

    @Prop({ type: String, enum: Utils.enumToArray(PaymentFailureReason) })
    @ApiPropertyOptional({ description: 'Failure reason', enum: PaymentFailureReason })
    failureReason?: PaymentFailureReason;

    @Prop({
        type: String,
        enum: Utils.enumToArray(PaymentType),
        required: true,
    })
    @ApiProperty({ description: 'Payment type', enum: PaymentType })
    type: PaymentType;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer' })
    @ApiPropertyOptional({ description: 'Customer ID', type: String })
    customer?: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'PaymentRequest' })
    @ApiPropertyOptional({ description: 'Payment request ID', type: String })
    paymentRequest?: any;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Account',
        required: true,
    })
    @ApiProperty({ description: 'Account ID', type: String })
    account: any;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        refPath: 'fundingSourceRef',
        required: true,
    })
    @ApiProperty({ description: 'Funding source document ID', type: String })
    fundingSource: any;

    @Prop({ type: String, required: true })
    @ApiProperty({ description: 'Funding source model reference name' })
    fundingSourceRef: string;

    @Prop({
        type: String,
        enum: Utils.enumToArray(PayoutPaymentMethod),
        required: true,
    })
    @ApiProperty({ description: 'Payment method', enum: PayoutPaymentMethod })
    method: PayoutPaymentMethod;

    @Prop({ type: PaymentMethodDataSchema, _id: false })
    @ApiPropertyOptional({ description: 'Payment method data', type: PaymentMethodData })
    methodData: PaymentMethodData;

    @Prop({
        type: String,
        enum: Utils.enumToArray(TransactionProcessor),
    })
    @ApiPropertyOptional({ description: 'Payment processor', enum: TransactionProcessor })
    processor: TransactionProcessor;

    @Prop({ type: ProcessorDataSchema, _id: false })
    @ApiPropertyOptional({ description: 'Processor data', type: ProcessorData })
    processorData?: ProcessorData;

    @Prop({ default: 0 })
    @ApiProperty({ description: 'Total fees in lowest currency unit', default: 0, type: Number })
    fees: number;

    @Prop({ type: [{ type: FeeBreakdownSchema, _id: false }] })
    @ApiPropertyOptional({ description: 'Fee breakdown entries', type: [FeeBreakdown] })
    feesBreakdown?: FeeBreakdown[];

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Dispute' })
    @ApiPropertyOptional({ description: 'Related dispute ID', type: String })
    dispute?: any;

    @Prop(raw({}))
    @ApiPropertyOptional({ description: 'Additional metadata' })
    metadata?: Record<string, any>;

    @Prop({
        type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Event' }],
        default: void 0,
    })
    @ApiPropertyOptional({ description: 'Related event IDs', type: [String] })
    events?: any[];

    @Prop({ type: [{ type: PaymentTimelineSchema }], _id: false })
    @ApiPropertyOptional({ description: 'Payment timeline', type: [PaymentTimeline] })
    timeline: PaymentTimeline[];

    @Exclude()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Business',
        required: true,
    })
    business: any;
}
const PaymentSchema = SchemaFactory.createForClass(Payment);
export const ApiHydratedPayment = ApiHydrated(Payment);
PaymentSchema.index(
    { business: 1, reference: 1 },
    { unique: true, partialFilterExpression: { reference: { $exists: true } } },
);

PaymentSchema.virtual('feeBreakdown').get(function (this: HydratedDocument<Payment>) {
    return this.feesBreakdown?.reduce((acc, curr) => {
        if (curr.group == FeeGroup.Custom) {
            const breakdown = {
                amount: curr.amount,
                group: curr.group,
                type: curr.type,
            };
            acc.push(breakdown);
            return acc;
        }

        if (curr.integral) {
            return acc;
        }

        const existing = acc.find((b) => b.group == FeeGroup.Platform);
        if (existing) {
            existing.amount += curr.amount;
            return acc;
        }
        const breakdown = {
            amount: curr.amount,
            group: FeeGroup.Platform,
            type: FeeBreakdownType.PlatformFees,
        };
        acc.push(breakdown);
        return acc;
    }, [] as FeeBreakdown[]);
});

export { PaymentSchema };

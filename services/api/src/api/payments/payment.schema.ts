import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Utils } from '@core/helpers';
import { enumProp, enumPropRequired, ModelIdTag, ModelSchemaOptions } from '@core/mongo';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Exclude } from 'class-transformer';
import { TransactionCurrency, TransactionProcessor, TransactionStatus } from '@api/transactions/transactions.enums';
import { FeeBreakdownSchema, FeeBreakdown, FeeBreakdownType } from '@api/fees/fee.schema';
import {
    PaymentStatus,
    PaymentFailureReason,
    PaymentType,
    PaymentMethod,
    PaymentMethodChargeType,
    PaymentTimelineAction,
    PaymentTimelineDataCode,
} from './payment.enums';
import { FeeGroup } from '@api/fees/fee.schema';
import { Account } from '@api/account/accounts.schema';
import { TagMap } from '@core/mongo';

export interface PaymentEnvoyResponse {
    status: string;
}

export interface IFundingSource {
    id: Types.ObjectId;
    ref: string;
    account?: HydratedDocument<Account>;
}

export function getFundingSource(account: HydratedDocument<Account>, tagMap: TagMap): IFundingSource {
    return {
        id: tagMap.id,
        ref: tagMap.model,
        account,
    };
}

@Schema()
export class ProcessorDataRequest {
    reference: string;
    sessionId?: string;
    sessionProvider?: string;
    requests?: any[];
    txnQueryRetryAt?: Date;
}
export const ProcessorDataRequestSchema = SchemaFactory.createForClass(ProcessorDataRequest);

@Schema(ModelSchemaOptions({ pick: 'sessionId', timestamps: false }))
export class ProcessorData {
    @Prop({ unique: true, sparse: true })
    reference: string;

    @Prop({ type: [{ type: ProcessorDataRequestSchema, _id: false }] })
    requests?: ProcessorDataRequest[];
}
export const ProcessorDataSchema = SchemaFactory.createForClass(ProcessorData);

@Schema(
    ModelSchemaOptions({
        objectIds: ['product:bp'],
        timestamps: false,
    }),
)
export class BillingPaymentMethodData {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'BillProduct', required: true })
    product: any;

    @Prop({ required: true })
    recipientRef: string;

    @Prop({ type: MongooseSchema.Types.Mixed, required: true })
    inputs: Record<string, any>;

    @Prop()
    commission: number;
}
export const BillPaymentMethodDataSchema = SchemaFactory.createForClass(BillingPaymentMethodData);

@Schema()
export class BankTransferPaymentMethodData {
    @Prop({ required: true })
    bankCode: string;

    @Prop({ required: true })
    bankName: string;

    @Prop({ required: true })
    accountNumber: string;

    @Prop({ required: true })
    accountName: string;

    @Prop({ required: true })
    sourceAccountName: string;

    @Prop()
    narration?: string;
}
export const BankTransferPaymentMethodDataSchema = SchemaFactory.createForClass(BankTransferPaymentMethodData);

@Schema(
    ModelSchemaOptions({
        objectIds: ['destination:#destinationRef'],
        pick: '-destinationRef -quoteRef',
        timestamps: false,
    }),
)
export class FxLocalTransferPaymentMethodData {
    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    rate: number;

    @Prop({
        type: String,
        enum: Utils.enumToArray(TransactionCurrency),
        required: true,
    })
    currency: TransactionCurrency;

    @Prop({ required: true })
    quoteHash: string;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        refPath: 'destinationRef',
        required: true,
    })
    destination: any;

    @Prop({ type: String, required: true })
    destinationRef: string;
}
export const FxLocalTransferPaymentMethodDataSchema = SchemaFactory.createForClass(FxLocalTransferPaymentMethodData);

@Schema(
    ModelSchemaOptions({
        objectIds: ['destination:ac'],
        timestamps: false,
    }),
)
export class LocalTransferPaymentMethodData {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
    destination?: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
    source?: any;

    @Prop()
    note?: string;
}
export const LocalTransferPaymentMethodDataSchema = SchemaFactory.createForClass(LocalTransferPaymentMethodData);

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
    type: PaymentMethodChargeType;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    rate: number;

    @Prop({
        type: String,
        enum: Utils.enumToArray(TransactionCurrency),
        required: true,
    })
    currency: TransactionCurrency;

    @Prop({ type: MongooseSchema.Types.ObjectId, refPath: 'forRef' })
    for?: any;

    @Prop({ type: String })
    forRef: string;
}
export const FxChargePaymentMethodDataSchema = SchemaFactory.createForClass(FxChargePaymentMethodData);

@Schema(
    ModelSchemaOptions({
        objectIds: ['for:#forRef'],
        pick: '-forRef',
        timestamps: false,
    }),
)
export class ForceChargePaymentMethodData {
    @Prop({ type: String })
    remarks?: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, refPath: 'forRef' })
    for?: any;

    @Prop({ type: String })
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
    remarks?: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, refPath: 'forRef' })
    for?: any;

    @Prop({ type: String })
    forRef: string;
}
export const RefundPaymentMethodDataSchema = SchemaFactory.createForClass(RefundPaymentMethodData);

@Schema()
export class PaymentMethodData {
    @Prop({ type: BankTransferPaymentMethodDataSchema, _id: false })
    bankTransfer?: BankTransferPaymentMethodData;

    @Prop({ type: FxLocalTransferPaymentMethodDataSchema, _id: false })
    fxLocalTransfer?: FxLocalTransferPaymentMethodData;

    @Prop({ type: FxChargePaymentMethodDataSchema, _id: false })
    fxCharge?: FxChargePaymentMethodData;

    @Prop({ type: ForceChargePaymentMethodDataSchema, _id: false })
    forceCharge?: ForceChargePaymentMethodData;

    @Prop({ type: RefundPaymentMethodDataSchema, _id: false })
    refund?: RefundPaymentMethodData;

    @Prop({ type: BillPaymentMethodDataSchema, _id: false })
    billing?: BillingPaymentMethodData;

    @Prop({ type: LocalTransferPaymentMethodDataSchema, _id: false })
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
    code?: string;

    @Prop()
    error?: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'BalanceHistory' })
    balanceLog?: any;
}
export const PaymentTimelineDataSchema = SchemaFactory.createForClass(PaymentTimelineData);

@Schema()
export class PaymentTimeline {
    @Prop(enumPropRequired(PaymentTimelineAction))
    action: string;

    @Prop({ type: PaymentTimelineDataSchema, _id: false })
    data?: PaymentTimelineData;

    @Prop(enumPropRequired(PaymentStatus))
    status: PaymentStatus;

    @Prop({ required: true })
    createdAt: Date;
}
export const PaymentTimelineSchema = SchemaFactory.createForClass(PaymentTimeline);

@Schema(
    ModelSchemaOptions({
        objectIds: [
            'business',
            'customer:cus',
            'fundingSource:#fundingSourceRef',
            'source:#sourceRef',
            'account:ac',
            'events:evt',
        ],
        pick: '-business -processor -fundingSourceRef -sourceRef -feesBreakdown',
        tag: ModelIdTag.Payment,
    }),
)
export class Payment {
    @Prop({ required: true })
    amount: number;

    @Prop()
    reference: string;

    @Prop({
        type: String,
        enum: Utils.enumToArray(TransactionCurrency),
        required: true,
    })
    currency: TransactionCurrency;

    @Prop({
        type: String,
        enum: Utils.enumToArray(PaymentStatus),
        default: PaymentStatus.New,
    })
    status: PaymentStatus;

    @Prop({ type: String, enum: Utils.enumToArray(PaymentFailureReason) })
    failureReason?: PaymentFailureReason;

    @Prop({
        type: String,
        enum: Utils.enumToArray(PaymentType),
        required: true,
    })
    type: PaymentType;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer' })
    customer?: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'PaymentRequest' })
    paymentRequest?: any;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Account',
        required: true,
    })
    account: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, refPath: 'fundingSourceRef' })
    fundingSource: any;

    @Prop({ type: String })
    fundingSourceRef: string;

    @Prop(enumPropRequired(PaymentMethod))
    method: PaymentMethod;

    @Prop({ type: PaymentMethodDataSchema, _id: false })
    methodData: PaymentMethodData;

    @Prop(enumProp(TransactionProcessor))
    processor: TransactionProcessor;

    @Prop({ type: ProcessorDataSchema, _id: false })
    processorData?: ProcessorData;

    @Prop({ default: 0 })
    fees: number;

    @Prop({ type: [{ type: FeeBreakdownSchema, _id: false }] })
    feesBreakdown?: FeeBreakdown[];

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Dispute' })
    dispute?: any;

    @Prop(raw({}))
    metadata?: Record<string, any>;

    @Prop({
        type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Event' }],
        default: void 0,
    })
    events?: any[];

    @Prop({ type: [{ type: PaymentTimelineSchema }], _id: false })
    timeline: PaymentTimeline[];

    @Exclude()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Business',
        required: true,
    })
    business: any;

    createdAt: Date;
}
const PaymentSchema = SchemaFactory.createForClass(Payment);
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

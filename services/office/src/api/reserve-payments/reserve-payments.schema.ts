import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ModelIdTag, ModelSchemaOptions, Utils } from '@core/helpers';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { TransactionCurrency, TransactionProcessor } from '@api/transactions/transactions.enums';
import { FeeBreakdownSchema, FeeBreakdown, FeeBreakdownType } from '@api/fees/fee.schema';
import { PaymentStatus, PaymentFailureReason, PaymentType, PayoutPaymentMethod } from '@api/payments/payment.enums';
import { FeeGroup } from '@api/fees/fee.schema';
import {
    PaymentMethodData,
    PaymentMethodDataSchema,
    ProcessorData,
    ProcessorDataSchema,
} from '@api/payments/payment.schema';

@Schema(
    ModelSchemaOptions({
        objectIds: ['account:ac.rsv'],
        pick: '-processor -processorData -fundingSourceRef -sourceRef -feesBreakdown',
        tag: ModelIdTag.ReservePayment,
    }),
)
export class ReservePayment {
    @Prop({ required: true })
    amount: number;

    @Prop({ unique: true, sparse: true })
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

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Account',
        required: true,
    })
    account: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    admin: any;

    @Prop({
        type: String,
        enum: Utils.enumToArray(PayoutPaymentMethod),
        required: true,
    })
    method: PayoutPaymentMethod;

    @Prop({ type: PaymentMethodDataSchema, _id: false })
    methodData: PaymentMethodData;

    @Prop({
        type: String,
        enum: Utils.enumToArray(TransactionProcessor),
    })
    processor: TransactionProcessor;

    @Prop({ type: ProcessorDataSchema, _id: false })
    processorData?: ProcessorData;

    @Prop({ default: 0 })
    fees: number;

    @Prop({ type: [{ type: FeeBreakdownSchema, _id: false }] })
    feesBreakdown?: FeeBreakdown[];

    @Prop(raw({}))
    metadata?: Record<string, any>;
}
const ReservePaymentSchema = SchemaFactory.createForClass(ReservePayment);

ReservePaymentSchema.virtual('feeBreakdown').get(function (this: HydratedDocument<ReservePayment>) {
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

export { ReservePaymentSchema };

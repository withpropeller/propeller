import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { enumProp, enumPropRequired, ModelIdTag, ModelSchemaOptions } from '@core/mongo';
import { Schema as MongooseSchema } from 'mongoose';
import { Exclude } from 'class-transformer';
import { TransactionCurrency, TransactionProcessor } from '@api/transactions/transactions.enums';
import { DepositChannel, DepositChannelsSchema } from '@api/account/accounts.schema';
import { PaymentRequestMethod, PaymentRequestStatus } from './payment.request.enums';

// Inlined from deleted @api/payment-authorizations
@Schema({ _id: false })
export class ProcessorDataRequest {
    @Prop() requestBody?: string;
    @Prop() responseBody?: string;
}
export const ProcessorDataRequestSchema = SchemaFactory.createForClass(ProcessorDataRequest);

@Schema(ModelSchemaOptions({ timestamps: false }))
export class PaymentRequestProcessorData {
    @Prop({ unique: true, sparse: true })
    reference: string;

    @Prop({ type: [{ type: ProcessorDataRequestSchema, _id: false }] })
    requests?: ProcessorDataRequest[];
}
export const ProcessorDataSchema = SchemaFactory.createForClass(PaymentRequestProcessorData);

@Schema(ModelSchemaOptions({ objectIds: ['authorization:p.auth'], timestamps: false }))
export class PaymentRequestMethodData {
    @Prop({ type: DepositChannelsSchema, _id: false })
    depositChannel?: DepositChannel;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'PaymentAuthorization' })
    authorization?: any;
}
export const PaymentRequestMethodDataSchema = SchemaFactory.createForClass(PaymentRequestMethodData);

@Schema(
    ModelSchemaOptions({
        objectIds: ['business', 'customer:cus', 'account:ac'],
        pick: '-business -processorData',
        tag: ModelIdTag.PaymentRequest,
    }),
)
export class PaymentRequest {
    @Prop({ required: true })
    amount: number;

    @Prop()
    reference: string;

    @Prop()
    description: string;

    @Prop(enumPropRequired(TransactionCurrency))
    currency: TransactionCurrency;

    @Prop(enumProp(PaymentRequestStatus, PaymentRequestStatus.New))
    status?: PaymentRequestStatus;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer' })
    customer?: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account', required: true })
    account: any;

    @Prop(enumPropRequired(PaymentRequestMethod))
    method: PaymentRequestMethod;

    @Prop({ type: PaymentRequestMethodDataSchema, _id: false })
    methodData: PaymentRequestMethodData;

    @Prop(enumProp(TransactionProcessor))
    processor?: TransactionProcessor;

    @Prop({ type: ProcessorDataSchema, _id: false })
    processorData?: PaymentRequestProcessorData;

    @Prop({ type: MongooseSchema.Types.Mixed })
    metadata?: Record<string, any>;

    @Prop({ type: Date })
    expiresAt?: Date;

    @Exclude()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Business',
        required: true,
    })
    business: any;
}
export const PaymentRequestSchema = SchemaFactory.createForClass(PaymentRequest);
PaymentRequestSchema.index(
    { business: 1, reference: 1 },
    { unique: true, partialFilterExpression: { reference: { $exists: true } } },
);

import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ModelIdTag, ModelSchemaOptions, Utils } from '@core/helpers';
import { Schema as MongooseSchema } from 'mongoose';
import { Exclude } from 'class-transformer';
import { TransactionCurrency } from '@api/transactions/transactions.enums';
import { FeeStatus } from './fee.enums';

export enum FeeStructure {
    Percentage = 'percentage',
    Flat = 'flat',
}

export enum FeeGroup {
    Partner = 'partner',
    Platform = 'platform',
    Custom = 'custom',
}

export enum FeeBreakdownType {
    Vat = 'vat',
    Emtl = 'emtl',
    NIP = 'nip',
    BankTransfer = 'bank-transfer',
    FxPurchase = 'fx-purchase',
    PlatformFees = 'platform-fees',
}

@Schema(
    ModelSchemaOptions({
        objectIds: ['business:bz', 'account:ac'],
        tag: ModelIdTag.Fee,
    }),
)
export class Fee {
    @Prop({ required: true })
    name: string;

    @Prop()
    description?: string;

    @Prop({ required: true })
    value: number;

    @Prop()
    cap?: number;

    @Prop({
        type: String,
        enum: Utils.enumToArray(FeeStructure),
        required: true,
    })
    structure: FeeStructure;

    @Prop({
        type: String,
        enum: Utils.enumToArray(TransactionCurrency),
        required: true,
    })
    currency: TransactionCurrency;

    @Prop({
        type: String,
        enum: Utils.enumToArray(FeeStatus),
        default: FeeStatus.Active,
    })
    status: FeeStatus;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Account',
        required: true,
    })
    account?: any;

    @Prop(raw({}))
    metadata?: Record<string, any>;

    @Exclude()
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Business',
        required: true,
    })
    business: any;
}
export const FeeSchema = SchemaFactory.createForClass(Fee);

@Schema()
export class FeeBreakdown {
    @Prop({
        type: String,
        enum: Utils.enumToArray(FeeBreakdownType),
        required: true,
    })
    type: string;

    @Prop({
        type: String,
        enum: Utils.enumToArray(FeeGroup),
        required: true,
    })
    group: string;

    @Prop({ required: true })
    amount: number;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Fee' })
    fee?: any;

    @Prop({ default: false })
    integral?: boolean;
}
export const FeeBreakdownSchema = SchemaFactory.createForClass(FeeBreakdown);

import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Utils } from '@core/helpers';
import { ModelIdTag, ModelSchemaOptions } from '@core/mongo';
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
    CardFunding = 'card-funding',
}

@Schema(
    ModelSchemaOptions({
        objectIds: ['business', 'account:ac'],
        pick: '-business',
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

    @Prop()
    name?: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Fee' })
    fee?: any;

    /**
     * If true, the fee is already included in the amount charged and should not be added to the total fees.
     * This is used to prevent double counting fees. Example: FX purchase fees are already included in the amount paid in FX.
     * This can also be used to calculate the revenue without the fees.
     */
    @Prop({ default: false })
    integral?: boolean;
}
export const FeeBreakdownSchema = SchemaFactory.createForClass(FeeBreakdown);

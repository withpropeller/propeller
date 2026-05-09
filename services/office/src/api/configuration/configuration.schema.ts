import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelIdTag, ModelSchemaOptions } from '@core/helpers';

@Schema(ModelSchemaOptions(['bankTransfer:fee', ' billPayment:fee']))
export class PaymentFeeSetting {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Fee' })
    bankTransfer?: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Fee' })
    billPayment?: any;
}

export const PaymentFeeSettingSchema = SchemaFactory.createForClass(PaymentFeeSetting);

@Schema(ModelSchemaOptions(['payInAccount:ac', 'payOutAccount:ac']))
export class PaymentConfiguration {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Account',
        required: true,
    })
    payInAccount: any;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Account',
        required: true,
    })
    payOutAccount: any;

    @Prop({ type: PaymentFeeSettingSchema, _id: false })
    feeSettings?: PaymentFeeSetting;
}
export const PaymentConfigurationSchema = SchemaFactory.createForClass(PaymentConfiguration);

@Schema(ModelSchemaOptions(['overdraftDailyInterest:float']))
export class AccountConfiguration {
    @Prop({ type: Number, required: true })
    overdraftDailyInterest: number;
}
export const AccountConfigurationSchema = SchemaFactory.createForClass(AccountConfiguration);

@Schema(
    ModelSchemaOptions({
        timestamps: false,
    }),
)
export class BillingConfigurationAddress {
    @Prop()
    city: string;

    @Prop()
    state: string;

    @Prop()
    countryCode: string;

    @Prop()
    addressLineOne: string;

    @Prop()
    addressLineTwo: string;

    @Prop()
    email: string;

    @Prop()
    phone: string;

    @Prop({ type: [String], default: void 0 })
    ccEmails?: string[];
}

export const BillingConfigurationAddressSchema = SchemaFactory.createForClass(BillingConfigurationAddress);

@Schema(ModelSchemaOptions([]))
export class BillingConfiguration {
    @Prop({ type: Number, required: true })
    cardBillingRate: number;

    @Prop({ type: Number, required: true })
    cardListRate: number;

    @Prop({ type: Number, required: true })
    crossBorderFeeRate: number;

    @Prop({ type: String, required: true })
    cardBillingUnit: string;

    @Prop({ type: String, required: true })
    contactFirstName: string;

    @Prop({ type: String, required: true })
    contactLastName: string;

    @Prop({ type: String, required: true })
    businessName: string;

    @Prop({ type: BillingConfigurationAddressSchema, required: true })
    address: BillingConfigurationAddress;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
    account?: any;
}
export const BillingConfigurationSchema = SchemaFactory.createForClass(BillingConfiguration);

@Schema(
    ModelSchemaOptions({
        objectIds: ['business:bz'],
        tag: ModelIdTag.Configuration,
    }),
)
export class Configuration {
    @Prop({ type: PaymentConfigurationSchema, _id: false, required: true })
    payment?: PaymentConfiguration;

    @Prop({ type: BillingConfigurationSchema, _id: false, required: false })
    billing?: BillingConfiguration;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Business',
        required: true,
        unique: true,
    })
    business: any;
}

export const ConfigurationSchema = SchemaFactory.createForClass(Configuration);

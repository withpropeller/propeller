import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelIdTag, ModelSchemaOptions, objectRefPropRequired } from '@core/mongo';

@Schema(
    ModelSchemaOptions({
        objectIds: ['bankTransfer:fee', ' billPayment:fee'],
        timestamps: false,
    }),
)
export class PaymentFeeSetting {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Fee' })
    bankTransfer?: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Fee' })
    billPayment?: any;
}

export const PaymentFeeSettingSchema = SchemaFactory.createForClass(PaymentFeeSetting);

@Schema(
    ModelSchemaOptions({
        objectIds: ['payInAccount:ac', 'payOutAccount:ac'],
        timestamps: false,
    }),
)
export class PaymentConfiguration {
    @Prop(objectRefPropRequired('Account'))
    payInAccount: any;

    @Prop(objectRefPropRequired('Account'))
    billAccount: any;

    @Prop(objectRefPropRequired('Account'))
    payOutAccount: any;

    @Prop(objectRefPropRequired('Account'))
    billCommissionAccount: any;

    @Prop({ type: PaymentFeeSettingSchema, _id: false })
    fees?: PaymentFeeSetting;
}
export const PaymentConfigurationSchema = SchemaFactory.createForClass(PaymentConfiguration);

@Schema(
    ModelSchemaOptions({
        objectIds: ['business'],
        pick: '-business',
        tag: ModelIdTag.Configuration,
    }),
)
export class Configuration {
    @Prop({ type: PaymentConfigurationSchema, _id: false, required: true })
    payment?: PaymentConfiguration;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Business',
        required: true,
        unique: true,
    })
    business: any;
}

export const ConfigurationSchema = SchemaFactory.createForClass(Configuration);

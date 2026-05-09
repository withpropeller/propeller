import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelIdTag, ModelSchemaOptions } from '@core/helpers';

@Schema(ModelSchemaOptions(['bankTransfer:fee', ' billPayment:fee']))
export class PaymentFeeSetting {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Fee'})
    bankTransfer?: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Fee' })
    billPayment?: any;
}

export const PaymentFeeSettingSchema = SchemaFactory.createForClass(PaymentFeeSetting);


@Schema(ModelSchemaOptions(['payInAccount:ac', 'payOutAccount:ac']))
export class PaymentConfiguration {

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account', required: true })
    payInAccount: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account', required: true })
    payOutAccount: any;

    @Prop({ type: PaymentFeeSettingSchema, _id: false, })
    feeSettings?: PaymentFeeSetting;

}
export const PaymentConfigurationSchema = SchemaFactory.createForClass(PaymentConfiguration);


@Schema(ModelSchemaOptions({
    objectIds: ['business'],
    pick: '-business',
    tag: ModelIdTag.Configuration,
}))
export class Configuration {
    
    @Prop({ type: PaymentConfigurationSchema, _id: false, required: true })
    payment?: PaymentConfiguration;
  
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business', required: true, unique: true })
    business: any;
}

export const ConfigurationSchema = SchemaFactory.createForClass(Configuration);

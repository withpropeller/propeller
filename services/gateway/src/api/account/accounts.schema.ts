import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ModelSchemaOptions, Utils } from '@core/helpers';
import { Exclude } from 'class-transformer';
import { Business } from '@api/business/business.schema';
import { AccountCurrency, AccountType, VirtualAccountPartner } from './account.enums';

export type AccountDocument = Account & Document;

@Schema(ModelSchemaOptions())
export class DepositChannel {
    @Prop({ required: true })
    accountName: string;

    @Prop({ required: true })
    accountNumber: string;

    @Prop({ required: true })
    bankName: string;

    @Prop({ required: true })
    bankCode: string;

    @Prop({
        type: String,
        enum: Utils.enumToArray(VirtualAccountPartner),
        required: true,
    })
    partner: VirtualAccountPartner;

}
export const DepositChannelsSchema = SchemaFactory.createForClass(DepositChannel);


@Schema(ModelSchemaOptions(['business'], '-isvId'))
export class Account {
    @Prop({ required: true })
    name: string;

    @Prop({ default: false })
    default: boolean;

    @Prop({
        type: String,
        enum: Utils.enumToArray(AccountType),
        required: true,
    })
    type: AccountType;

    @Prop({ required: true })
    isvId: string;

    @Prop({
        type: String,
        enum: Utils.enumToArray(AccountCurrency),
        required: true,
    })
    currency: AccountCurrency;

    @Exclude()
    @Prop({ type: [{ type: DepositChannelsSchema, _id: false }], default: void 0})
    depositChannels: DepositChannel[];

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business' })
    business: Business;

}
export const AccountSchema = SchemaFactory.createForClass(Account);

import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';
import { Utils } from '@core/helpers';
import { enumPropRequired, ModelIdTag, ModelSchemaOptions } from '@core/mongo';
import { Type } from 'class-transformer';
import {
    AccountCurrency,
    AccountStatus,
    AccountType,
    DepositChannelType,
    VirtualAccountPartner,
} from './account.enums';

@Schema(ModelSchemaOptions({ pick: '-partner', timestamps: false }))
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

    @Prop({
        type: String,
        enum: Utils.enumToArray(DepositChannelType),
        default: DepositChannelType.BankAccount,
    })
    type: DepositChannelType;
}
export const DepositChannelsSchema = SchemaFactory.createForClass(DepositChannel);

@Schema(
    ModelSchemaOptions({
        objectIds: ['business', 'customer:cus', 'settlementAccount:ac', 'balance:bal'],
        pick: '-business -isvId -default -balance_old',
        tag: ModelIdTag.Account,
    }),
)
export class Account {
    @Prop({ required: true })
    name: string;

    @Prop()
    reference: string;

    @Prop({ default: false })
    default: boolean;

    @Prop({
        type: String,
        enum: Utils.enumToArray(AccountType),
        required: true,
    })
    type: AccountType;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
    settlementAccount?: any;

    @Prop({
        type: String,
        enum: Utils.enumToArray(AccountStatus),
        default: AccountStatus.Active,
    })
    status: AccountStatus;

    @Prop({ unique: true, sparse: true })
    isvId?: string;

    @Prop(enumPropRequired(AccountCurrency))
    currency: AccountCurrency;

    @Prop({
        type: [{ type: DepositChannelsSchema, _id: false }],
        default: void 0,
    })
    @Type(() => DepositChannel)
    depositChannels: DepositChannel[];

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business' })
    business: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer' })
    customer?: Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Balance' })
    balance?: Types.ObjectId;

    @Prop(raw({}))
    metadata?: Record<string, any>;
}
export const AccountSchema = SchemaFactory.createForClass(Account);
AccountSchema.index(
    { business: 1, reference: 1 },
    { unique: true, partialFilterExpression: { reference: { $exists: true } } },
);

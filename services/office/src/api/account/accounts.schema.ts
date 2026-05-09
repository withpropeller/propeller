import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { enumPropRequired, ModelIdTag, ModelSchemaOptions, Utils } from '@core/helpers';
import { Type } from 'class-transformer';
import {
    AccountCurrency,
    AccountStatus,
    AccountType,
    DepositChannelType,
    VirtualAccountPartner,
} from './account.enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiHydrated } from '@common/dtos';

export type AccountDocument = Account & Document;

@Schema(ModelSchemaOptions())
export class DepositChannel {
    @Prop({ required: true })
    @ApiProperty({ description: 'Account holder name' })
    accountName: string;

    @Prop({ required: true })
    @ApiProperty({ description: 'Account number' })
    accountNumber: string;

    @Prop({ required: true })
    @ApiProperty({ description: 'Bank name' })
    bankName: string;

    @Prop({ required: true })
    @ApiProperty({ description: 'Bank code' })
    bankCode: string;

    @Prop({
        type: String,
        enum: Utils.enumToArray(VirtualAccountPartner),
        required: true,
    })
    @ApiProperty({ description: 'Virtual account partner', enum: VirtualAccountPartner })
    partner: VirtualAccountPartner;

    @Prop({
        type: String,
        enum: Utils.enumToArray(DepositChannelType),
        default: DepositChannelType.BankAccount,
    })
    @ApiProperty({ description: 'Deposit channel type', enum: DepositChannelType })
    type: DepositChannelType;
}
export const DepositChannelsSchema = SchemaFactory.createForClass(DepositChannel);

@Schema(
    ModelSchemaOptions({
        objectIds: ['business:bz', 'customer:cus', 'settlementAccount:ac'],
        pick: '-isvId -default',
        tag: ModelIdTag.Account,
    }),
)
export class Account {
    @Prop({ required: true })
    @ApiProperty({ description: 'Account name' })
    name: string;

    @Prop()
    @ApiPropertyOptional({ description: 'Account reference' })
    reference: string;

    @Prop({ default: false })
    @ApiProperty({ description: 'Is default account', type: Boolean })
    default: boolean;

    @Prop({
        type: String,
        enum: Utils.enumToArray(AccountType),
        required: true,
    })
    @ApiProperty({ description: 'Account type', enum: AccountType })
    type: AccountType;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
    @ApiPropertyOptional({ description: 'Settlement account ID', type: String })
    settlementAccount?: any;

    @Prop({
        type: String,
        enum: Utils.enumToArray(AccountStatus),
        default: AccountStatus.Active,
    })
    @ApiProperty({ description: 'Account status', enum: AccountStatus })
    status: AccountStatus;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Balance' })
    @ApiPropertyOptional({ description: 'Balance ID', type: String })
    balance?: any;

    @Prop(enumPropRequired(AccountCurrency))
    @ApiProperty({ description: 'Account currency', enum: AccountCurrency })
    currency: AccountCurrency;

    @Prop({
        type: [{ type: DepositChannelsSchema, _id: false }],
        default: void 0,
    })
    @Type(() => DepositChannel)
    @ApiPropertyOptional({ description: 'Deposit channels', type: [DepositChannel] })
    depositChannels: DepositChannel[];

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business' })
    business: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer' })
    @ApiPropertyOptional({ description: 'Customer ID', type: String })
    customer?: Types.ObjectId;

    @Prop(raw({}))
    @ApiPropertyOptional({ description: 'Additional metadata', type: Object })
    metadata?: Record<string, any>;
}
export const AccountSchema = SchemaFactory.createForClass(Account);
AccountSchema.index(
    { business: 1, reference: 1 },
    { unique: true, partialFilterExpression: { reference: { $exists: true } } },
);
export const ApiHydratedAccount = ApiHydrated(Account);
export const ApiHydratedDepositChannel = ApiHydrated(DepositChannel);

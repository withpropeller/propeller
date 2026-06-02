import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ModelSchemaOptions, Utils } from '@core/helpers';
import { Exclude } from 'class-transformer';
import { Business } from '@api/business/business.schema';
import { AccountCurrency, AccountType, VirtualAccountPartner } from './account.enums';
import { ApiProperty } from '@nestjs/swagger';
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
}
export const DepositChannelsSchema = SchemaFactory.createForClass(DepositChannel);

@Schema(ModelSchemaOptions(['business'], '-isvId'))
export class Account {
    @Prop({ required: true })
    @ApiProperty({ description: 'Account name' })
    name: string;

    @Prop({ default: false })
    @ApiProperty({ description: 'Whether this is the default account', default: false, type: Boolean })
    default: boolean;

    @Prop({
        type: String,
        enum: Utils.enumToArray(AccountType),
        required: true,
    })
    @ApiProperty({ description: 'Account type', enum: AccountType })
    type: AccountType;

    @Prop({ required: true })
    @ApiProperty({ description: 'ISV identifier' })
    isvId: string;

    @Prop({
        type: String,
        enum: Utils.enumToArray(AccountCurrency),
        required: true,
    })
    @ApiProperty({ description: 'Account currency', enum: AccountCurrency })
    currency: AccountCurrency;

    @Exclude()
    @Prop({ type: [{ type: DepositChannelsSchema, _id: false }], default: void 0 })
    @ApiProperty({ description: 'Deposit channels', type: [DepositChannel] })
    depositChannels: DepositChannel[];

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business' })
    @ApiProperty({ description: 'Business ID', type: String })
    business: Business;
}
export const AccountSchema = SchemaFactory.createForClass(Account);
export const ApiHydratedAccount = ApiHydrated(Account);
export const ApiHydratedDepositChannel = ApiHydrated(DepositChannel);

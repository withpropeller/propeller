import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';
import { enumPropRequired, ModelIdTag, ModelSchemaOptions, Utils } from '@core/helpers';
import { TransactionCurrency, TransactionMode } from '@api/transactions/transactions.enums';
import { DepositChannelsSchema, DepositChannel } from '@api/account/accounts.schema';
import { Type } from 'class-transformer';
import { SettlementAccountCurrency, SettlementAccountPartner } from './settlement-account.enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiHydrated } from '@common/dtos';

@Schema(ModelSchemaOptions({ tag: ModelIdTag.SettlementAccount }))
export class SettlementAccount {
    @Prop({ required: true })
    @ApiProperty({ description: 'Settlement account name' })
    name: string;

    @Prop({ type: [{ type: DepositChannelsSchema, _id: false }], default: void 0 })
    @Type(() => DepositChannel)
    @ApiProperty({ description: 'Deposit channels', type: [DepositChannel] })
    depositChannels: DepositChannel[];

    @Prop({ required: true })
    @ApiProperty({ description: 'Settlement account partner', enum: SettlementAccountPartner })
    partner: SettlementAccountPartner;

    @Prop()
    @ApiPropertyOptional({ description: 'Account identifier' })
    identifier: string;

    @Prop({ type: Types.ObjectId, ref: 'Balance' })
    @ApiProperty({ description: 'Balance document ID', type: String })
    balance: any;

    @Prop(enumPropRequired(SettlementAccountCurrency))
    @ApiProperty({ description: 'Settlement account currency', enum: SettlementAccountCurrency })
    currency: SettlementAccountCurrency;
}

export const SettlementAccountSchema = SchemaFactory.createForClass(SettlementAccount);
export const ApiHydratedSettlementAccount = ApiHydrated(SettlementAccount);

@Schema(
    ModelSchemaOptions({
        tag: ModelIdTag.SettlementAccountLog,
        objectIds: ['source:#sourceRef'],
        pick: '-data -rawData -sourceRef',
    }),
)
export class SettlementAccountLog {
    @Prop()
    @ApiProperty({ description: 'Account number' })
    accountNumber: string;

    @Prop()
    @ApiProperty({ description: 'Available balance after transaction', type: Number })
    availableBalance: number;

    @Prop()
    @ApiProperty({ description: 'Transaction reference' })
    reference: string;

    @Prop(raw({}))
    @ApiPropertyOptional({ description: 'Raw provider data' })
    rawData: any;

    @Prop({
        type: String,
        enum: Utils.enumToArray(TransactionCurrency),
        required: true,
    })
    @ApiProperty({ description: 'Transaction currency', enum: TransactionCurrency })
    currency: TransactionCurrency;

    @Prop({
        type: String,
        enum: Utils.enumToArray(TransactionMode),
        required: true,
    })
    @ApiProperty({ description: 'Transaction mode', enum: TransactionMode })
    mode: TransactionMode;

    @Prop()
    @ApiProperty({ description: 'Amount change in this transaction', type: Number })
    changeAmount: number;

    @Prop()
    @ApiProperty({ description: 'Transaction amount', type: Number })
    amount: number;

    @Prop()
    @ApiProperty({ description: 'Transaction narration' })
    narration: string;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        refPath: 'sourceRef',
    })
    @ApiPropertyOptional({ description: 'Source document ID', type: String })
    source?: any;

    @Prop({ type: String })
    @ApiPropertyOptional({ description: 'Source model reference name' })
    sourceRef?: string;
}

export const SettlementAccountLogSchema = SchemaFactory.createForClass(SettlementAccountLog);
export const ApiHydratedSettlementAccountLog = ApiHydrated(SettlementAccountLog);

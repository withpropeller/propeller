import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelIdTag, ModelSchemaOptions, Utils } from '@core/helpers';
import { Type } from 'class-transformer';
import { AccountCurrency } from '@api/account/account.enums';
import { TransactionMode } from '@api/transactions/transactions.enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiHydrated } from '@common/dtos';

@Schema()
export class AccountLogMetadata {
    @Prop({ required: true })
    @ApiProperty({ description: 'Log metadata ID' })
    id: string;

    @Prop({ required: true, unique: true })
    @ApiProperty({ description: 'Transaction ID' })
    txId: string;
}
export const AccountLogMetadataSchema = SchemaFactory.createForClass(AccountLogMetadata);

@Schema()
export class AccountBalanceLog {
    @Prop()
    @ApiPropertyOptional({ description: 'Amount in lowest currency unit', type: Number })
    amount: number;

    @Prop()
    @ApiPropertyOptional({ description: 'Source reference' })
    source: string;
}
export const AccountBalanceLogSchema = SchemaFactory.createForClass(AccountBalanceLog);

@Schema(
    ModelSchemaOptions({
        objectIds: ['business:bz', 'account:ac', 'source:#sourceRef'],
        pick: '-sourceRef -rawData -metadata',
        tag: ModelIdTag.AccountLog,
    }),
)
export class AccountLog {
    @Prop({ required: true })
    @ApiProperty({ description: 'Log entry name' })
    name: string;

    @Prop()
    @ApiPropertyOptional({ description: 'Available balance after transaction', type: Number })
    availableBalance: number;

    @Prop()
    @ApiPropertyOptional({ description: 'Locked balance after transaction', type: Number })
    lockedBalance: number;

    @Prop()
    @ApiPropertyOptional({ description: 'Change in locked balance', type: Number })
    changeLockAmount: number;

    @Prop()
    @ApiPropertyOptional({ description: 'Change in available balance', type: Number })
    changeAmount: number;

    @Prop({
        type: [{ type: AccountBalanceLogSchema, _id: false }],
        default: void 0,
    })
    @Type(() => AccountBalanceLog)
    @ApiPropertyOptional({ description: 'Locked balance log entries', type: [AccountBalanceLog] })
    lockedBalanceLog: AccountBalanceLog[];

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
    @ApiPropertyOptional({ description: 'Account ID', type: String })
    account?: any;

    @Prop(raw({}))
    rawData?: any;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        refPath: 'sourceRef',
        required: true,
    })
    @ApiProperty({ description: 'Source document ID', type: String })
    source: any;

    @Prop({ type: String, required: true })
    @ApiProperty({ description: 'Source document model reference' })
    sourceRef: string;

    @Prop({ type: AccountLogMetadataSchema, _id: false })
    @Type(() => AccountLogMetadata)
    @ApiPropertyOptional({ description: 'Log metadata', type: AccountLogMetadata })
    metadata?: AccountLogMetadata;

    @Prop({
        type: String,
        enum: Utils.enumToArray(AccountCurrency),
        required: true,
    })
    @ApiProperty({ description: 'Currency', enum: AccountCurrency })
    currency: AccountCurrency;

    @Prop({
        type: String,
        enum: Utils.enumToArray(TransactionMode),
        required: true,
    })
    @ApiProperty({ description: 'Transaction mode', enum: TransactionMode })
    mode: TransactionMode;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business' })
    business: any;
}
export const AccountLogSchema = SchemaFactory.createForClass(AccountLog);
export const ApiHydratedAccountLog = ApiHydrated(AccountLog);

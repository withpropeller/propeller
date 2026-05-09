import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { Utils } from '@core/helpers';
import { ModelIdTag, ModelSchemaOptions } from '@core/mongo';
import { Type } from 'class-transformer';
import { AccountCurrency } from '@api/account/account.enums';
import { TransactionMode } from '@api/transactions/transactions.enums';

@Schema()
export class AccountLogMetadata {
    @Prop({ required: true })
    id: string;

    @Prop({ required: true, unique: true })
    txId: string;
}
export const AccountLogMetadataSchema = SchemaFactory.createForClass(AccountLogMetadata);

@Schema()
export class AccountBalanceLog {
    @Prop()
    amount: number;

    @Prop()
    source: string;
}
export const AccountBalanceLogSchema = SchemaFactory.createForClass(AccountBalanceLog);

@Schema(
    ModelSchemaOptions({
        objectIds: ['business', 'account:ac', 'source:#sourceRef'],
        pick: '-business -sourceRef -rawData -metadata',
        tag: ModelIdTag.AccountLog,
    }),
)
export class AccountLog {
    @Prop({ required: true })
    name: string;

    @Prop()
    availableBalance: number;

    @Prop()
    lockedBalance: number;

    @Prop()
    changeLockAmount: number;

    @Prop()
    changeAmount: number;

    @Prop({
        type: [{ type: AccountBalanceLogSchema, _id: false }],
        default: void 0,
    })
    @Type(() => AccountBalanceLog)
    lockedBalanceLog: AccountBalanceLog;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
    account?: any;

    @Prop(raw({}))
    rawData?: any;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        refPath: 'sourceRef',
        required: true,
    })
    source: any;

    @Prop({ type: String, required: true })
    sourceRef: string;

    @Prop({ type: AccountLogMetadataSchema, _id: false })
    @Type(() => AccountLogMetadata)
    metadata?: AccountLogMetadata;

    @Prop({
        type: String,
        enum: Utils.enumToArray(AccountCurrency),
        required: true,
    })
    currency: AccountCurrency;

    @Prop({
        type: String,
        enum: Utils.enumToArray(TransactionMode),
        required: true,
    })
    mode: TransactionMode;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business' })
    business: any;
}
export const AccountLogSchema = SchemaFactory.createForClass(AccountLog);

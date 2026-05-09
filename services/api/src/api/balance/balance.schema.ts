import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { LedgerMetaSchema, ModelIdTag, ModelSchemaOptions, enumPropRequired } from '@core/mongo';
import { AccountCurrency } from '@api/account/account.enums';
import { BalanceMode } from './balance.enums';

@Schema(
    ModelSchemaOptions({
        objectIds: ['transaction:txn', 'source:#sourceRef'],
        pick: '-business -_meta -sourceRef',
        tag: ModelIdTag.Balance,
    }),
)
export class Balance {
    @Prop()
    available: number;

    @Prop()
    availableChange: number;

    @Prop(enumPropRequired(AccountCurrency))
    currency: AccountCurrency;

    @Prop(enumPropRequired(BalanceMode))
    mode: BalanceMode;

    @Prop({ type: MongooseSchema.Types.ObjectId, refPath: 'sourceRef' })
    source: any;

    @Prop({ type: String })
    sourceRef: string;

    @Prop({ type: LedgerMetaSchema, _id: false })
    _meta?: any;
}

export const BalanceSchema = SchemaFactory.createForClass(Balance);

@Schema(
    ModelSchemaOptions({
        objectIds: ['business:bz', 'source:#sourceRef'],
        pick: '-business -_meta -sourceRef -createdAt',
        collection: 'balances_history',
        tag: ModelIdTag.BalanceHistory,
    }),
)
export class BalanceHistory {
    @Prop()
    available: number;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business' })
    business: any;

    @Prop()
    availableChange: number;

    @Prop(enumPropRequired(AccountCurrency))
    currency: AccountCurrency;

    @Prop(enumPropRequired(BalanceMode))
    mode: BalanceMode;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Transaction', required: true })
    transaction: any;

    @Prop({ type: LedgerMetaSchema, _id: false })
    _meta?: any;
}

export const BalanceHistorySchema = SchemaFactory.createForClass(BalanceHistory);

BalanceHistorySchema.virtual('balanceBefore').get(function (this: HydratedDocument<Balance>): number {
    return this.available - this.availableChange;
});

BalanceHistorySchema.virtual('txTime').get(function (this: HydratedDocument<Balance>): number {
    return this._meta.txTime;
});

BalanceHistorySchema.index({ '_meta.origId': 1, '_meta.seqNo': -1 }, { background: true });

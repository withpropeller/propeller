import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { ModelIdTag, ModelSchemaOptions, enumPropRequired } from '@core/mongo';
import { AccountCurrency } from '@api/account/account.enums';
import { BalanceMode } from './balance.enums';

@Schema(
    ModelSchemaOptions({
        objectIds: ['business:bz', 'source:#sourceRef', 'pi:#piRef'],
        pick: '-_meta -piRef -sourceRef',
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

    @Prop({ type: MongooseSchema.Types.ObjectId, refPath: 'sourceRef', required: true, unique: true })
    source: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, refPath: 'piRef', required: true })
    pi: any;

    @Prop({ type: String, required: true })
    sourceRef: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business' })
    business: any;

    @Prop({ type: MongooseSchema.Types.Mixed })
    _meta?: any;
}

export const BalanceSchema = SchemaFactory.createForClass(Balance);

@Schema(
    ModelSchemaOptions({
        objectIds: ['business:bz', 'source:#sourceRef', 'pi:#piRef'],
        pick: '-_meta -piRef -sourceRef',
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

    @Prop({ type: MongooseSchema.Types.ObjectId, refPath: 'sourceRef', required: true, unique: true })
    source: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, refPath: 'piRef', required: true, unique: true })
    pi: any;

    @Prop({ type: String, required: true })
    sourceRef: string;

    @Prop({ type: MongooseSchema.Types.Mixed })
    _meta?: any;
}

export const BalanceHistorySchema = SchemaFactory.createForClass(BalanceHistory);

BalanceHistorySchema.virtual('balanceBefore').get(function (this: HydratedDocument<Balance>): number {
    return this.available - this.availableChange;
});

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AccountCurrency, AccountStatus } from '@api/account/account.enums';
import { Schema as MongooseSchema } from 'mongoose';
import { enumPropRequired, ModelIdTag, ModelSchemaOptions } from '@core/mongo';
import { DepositChannelsSchema, DepositChannel } from '@api/account/accounts.schema';
import { Type } from 'class-transformer';

@Schema(
    ModelSchemaOptions({
        objectIds: ['balance:bal'],
        tag: ModelIdTag.ReserveAccount,
    }),
)
export class ReserveAccount {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    slug: string;

    @Prop(enumPropRequired(AccountStatus))
    status: AccountStatus;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Balance' })
    balance: any;

    @Prop(enumPropRequired(AccountCurrency))
    currency: AccountCurrency;

    @Prop({
        type: [{ type: DepositChannelsSchema, _id: false }],
        default: void 0,
    })
    @Type(() => DepositChannel)
    depositChannels: DepositChannel[];
}
export const ReserveAccountSchema = SchemaFactory.createForClass(ReserveAccount);

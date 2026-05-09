import { Utils } from '@core/helpers';
import { Prop } from '@nestjs/mongoose';
import { SpendingLimitFrequency, SpendingLimitType } from './payment-resource.enums';

export class SpendingLimit {
    @Prop({
        type: String,
        enum: Utils.enumToArray(SpendingLimitType),
        required: true,
    })
    type: SpendingLimitType;

    @Prop({ required: true })
    amount: number;

    @Prop({
        type: String,
        enum: Utils.enumToArray(SpendingLimitFrequency),
    })
    frequency?: SpendingLimitFrequency;

    @Prop()
    renewalDay?: number;

    @Prop()
    wipeBalance: boolean;
}

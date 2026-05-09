import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { Utils } from '@core/helpers';
import { BusinessStatus } from './business.enums';
import { ModelSchemaOptions } from '@core/mongo';

@Schema(ModelSchemaOptions(['onboardSurvey', 'kyc'], '-owner'))
export class Business {
    @Prop({ length: 50 })
    name: string;

    @Prop()
    email: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    owner: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'OnboardSurvey' })
    onboardSurvey: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'BusinessKYC' })
    kyc: any;

    @Prop({
        type: String,
        enum: Utils.enumToArray(BusinessStatus),
        default: BusinessStatus.NOT_APPROVED,
    })
    status: BusinessStatus;
}

export const BusinessSchema = SchemaFactory.createForClass(Business);

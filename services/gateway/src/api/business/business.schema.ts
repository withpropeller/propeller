import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelSchemaOptions, Utils } from '@core/helpers';
import { OnboardSurvey } from '@auth/onboard/onboard-survey.schema';
import { BusinessStatus, KybStatus, BusinessTier } from './business.enums';
import { BusinessKYC } from '../business-kyc/business-kyc.schema';
import { User } from '@api/users/user.schema';


@Schema(ModelSchemaOptions(['onboardSurvey', 'kyc'], '-owner'))
export class Business {
    @Prop({ length: 50 })
    name: string;

    @Prop()
    email: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    owner: User;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'OnboardSurvey' })
    onboardSurvey: OnboardSurvey;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'BusinessKYC' })
    kyc: BusinessKYC;

    @Prop({
        type: String,
        enum: Utils.enumToArray(BusinessStatus),
        default: BusinessStatus.NOT_APPROVED,
    })
    status: BusinessStatus;

    @Prop({
        type: String,
        enum: Utils.enumToArray(KybStatus),
        default: KybStatus.Draft,
    })
    kyb_status: KybStatus;

    @Prop({
        type: String,
        enum: Utils.enumToArray(BusinessTier),
        default: BusinessTier.Merchant,
    })
    tier: BusinessTier;

    @Prop({ required: false })
    paykka_merch_id?: string;

    @Prop({ required: false })
    paykka_status?: string;
}

export const BusinessSchema = SchemaFactory.createForClass(Business);

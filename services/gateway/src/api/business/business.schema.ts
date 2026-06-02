import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelSchemaOptions, Utils } from '@core/helpers';
import { OnboardSurvey } from '@auth/onboard/onboard-survey.schema';
import { BusinessStatus, KybStatus, BusinessTier } from './business.enums';
import { BusinessKYC } from '../business-kyc/business-kyc.schema';
import { User } from '@api/users/user.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiHydrated } from '@common/dtos';

@Schema(ModelSchemaOptions(['onboardSurvey', 'kyc'], '-owner'))
export class Business {
    @Prop({ length: 50 })
    @ApiProperty({ description: 'Business name' })
    name: string;

    @Prop()
    @ApiProperty({ description: 'Business email address' })
    email: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    @ApiProperty({ description: 'Owner user ID', type: String })
    owner: User;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'OnboardSurvey' })
    @ApiPropertyOptional({ description: 'Onboard survey ID', type: String })
    onboardSurvey: OnboardSurvey;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'BusinessKYC' })
    @ApiPropertyOptional({ description: 'Business KYC ID', type: String })
    kyc: BusinessKYC;

    @Prop({
        type: String,
        enum: Utils.enumToArray(BusinessStatus),
        default: BusinessStatus.NOT_APPROVED,
    })
    @ApiProperty({
        description: 'Business approval status',
        enum: BusinessStatus,
        default: BusinessStatus.NOT_APPROVED,
    })
    status: BusinessStatus;

    @Prop({
        type: String,
        enum: Utils.enumToArray(KybStatus),
        default: KybStatus.Draft,
    })
    @ApiProperty({ description: 'KYB status', enum: KybStatus, default: KybStatus.Draft })
    kyb_status: KybStatus;

    @Prop({
        type: String,
        enum: Utils.enumToArray(BusinessTier),
        default: BusinessTier.Merchant,
    })
    @ApiProperty({ description: 'Business tier', enum: BusinessTier, default: BusinessTier.Merchant })
    tier: BusinessTier;

    @Prop({ required: false })
    @ApiPropertyOptional({ description: 'PayKKa merchant ID' })
    paykka_merch_id?: string;

    /** The request_id we sent to PayKKa's assessment/apply, echoed back in notify. */
    @Prop({ required: false })
    @ApiPropertyOptional({ description: 'PayKKa assessment request ID' })
    paykka_request_id?: string;

    /** Raw PayKKa assessment status: INIT | WAIT | PASS | REFUSED | AUTH_FAIL | REJECTED. */
    @Prop({ required: false })
    @ApiPropertyOptional({ description: 'Raw PayKKa assessment status' })
    paykka_status?: string;

    /** PayKKa-assigned risk level on a PASS: LOW | MIDDLE | HIGH. */
    @Prop({ required: false })
    @ApiPropertyOptional({ description: 'PayKKa risk level' })
    paykka_risk_level?: string;
}

export const BusinessSchema = SchemaFactory.createForClass(Business);
export const ApiHydratedBusiness = ApiHydrated(Business);

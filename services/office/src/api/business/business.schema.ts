import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { ModelIdTag, ModelSchemaOptions, Utils } from '@core/helpers';
import { OnboardSurvey } from '@auth/onboard/onboard-survey.schema';
import { BusinessStatus } from './business.enums';
import { User } from '@api/users/user.schema';
import { BusinessKYC } from './business-kyc.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiHydrated } from '@common/dtos';

@Schema(
    ModelSchemaOptions({
        objectIds: ['onboardSurvey:os', 'kyc:kyc', 'owner:usr'],
        tag: ModelIdTag.Business,
    }),
)
export class Business {
    @Prop({ length: 50 })
    @ApiProperty({ description: 'Business name' })
    name: string;

    @Prop()
    @ApiProperty({ description: 'Business email' })
    email: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    @ApiProperty({ description: 'Business owner user ID', type: String })
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
    @ApiProperty({ description: 'Business status', enum: BusinessStatus })
    status: BusinessStatus;
}

export const BusinessSchema = SchemaFactory.createForClass(Business);
export const ApiHydratedBusiness = ApiHydrated(Business);

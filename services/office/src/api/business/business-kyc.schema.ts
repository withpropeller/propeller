import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Utils } from '@core/helpers';
import { Business } from '../business/business.schema';
import { Type } from 'class-transformer';
import { AWSObjectURL } from '@common/models/aws-object';
import { ModelSchemaOptions } from '@core/mongo';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiHydrated } from '@common/dtos';

export enum KYCNameTitle {
    Mr = 'mr',
    Mrs = 'mrs',
    Miss = 'miss',
    Chief = 'chief',
}

export enum BusinessRegistrationType {
    PrivateLimitedCompany = 'private-limited-company',
    CompanyLimitedByGuarantee = 'company-limited-by-guarantee',
    PublicLimitedCompany = 'public-limited-company',
    BusinessName = 'business-name',
    UnlimitedCompany = 'unlimited-company',
    IncorporatedTrustees = 'incorporated-trustees',
}
export type KYCWizardDocument = BusinessKYC & Document;

export class KYCBusinessInformation {
    @Prop()
    @ApiProperty({ description: 'Business name' })
    businessName: string;

    @Prop({
        type: String,
        enum: Utils.enumToArray(BusinessRegistrationType),
    })
    @ApiProperty({ description: 'Business registration type', enum: BusinessRegistrationType })
    registrationType: BusinessRegistrationType;

    @Prop()
    @ApiProperty({ description: 'Registration number' })
    registrationNumber: string;

    @Prop()
    @ApiProperty({ description: 'Business description' })
    businessDescription: string;

    @Prop()
    @ApiProperty({ description: 'Tax identification number' })
    tin: string;
}

export class KYCBusinessAddress {
    @Prop()
    @ApiProperty({ description: 'City' })
    city: string;

    @Prop()
    @ApiProperty({ description: 'State' })
    state: string;

    @Prop()
    @ApiProperty({ description: 'Country code' })
    countryCode: string;

    @Prop()
    @ApiProperty({ description: 'Phone number' })
    phone: string;

    @Prop()
    @ApiProperty({ description: 'Address line 1' })
    addressLineOne: string;

    @Prop({ required: false })
    @ApiPropertyOptional({ description: 'Address line 2' })
    addressLineTwo?: string;

    @Prop()
    @ApiProperty({ description: 'Email address' })
    email: string;
}

@Schema(ModelSchemaOptions())
export class BusinessLeadership {
    @Prop()
    @ApiProperty({ description: 'First name' })
    firstName: string;

    @Prop({ required: false })
    @ApiPropertyOptional({ description: 'Middle name' })
    middleName?: string;

    @Prop()
    @ApiProperty({ description: 'Last name' })
    lastName: string;

    @Prop()
    @ApiProperty({ description: 'Role' })
    role: string;

    @Prop()
    @ApiProperty({ description: 'Nationality code' })
    nationalityCode: string;

    @Prop()
    @ApiProperty({ description: 'Phone number' })
    phone: string;

    @Prop()
    @ApiProperty({ description: 'Email address' })
    email: string;

    @Prop()
    @ApiProperty({ description: 'Date of birth' })
    dateOfBirth: string;

    @Prop()
    @ApiProperty({ description: 'BVN' })
    bvn: string;
}

export const BusinessLeadershipSchema = SchemaFactory.createForClass(BusinessLeadership);

export class KYCDocumentation {
    @Prop({ type: AWSObjectURL, _id: false })
    @ApiProperty({ description: 'CAC certificate document', type: AWSObjectURL })
    cacCertificate: AWSObjectURL;

    @Prop({ type: AWSObjectURL, _id: false })
    @ApiProperty({ description: 'Application document', type: AWSObjectURL })
    applicationDoc: AWSObjectURL;
}

@Schema(ModelSchemaOptions(['business'], '-infraOwned'))
export class BusinessKYC {
    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Business',
        unique: true,
    })
    business: Business;

    @Prop({ type: KYCBusinessInformation, _id: false })
    @ApiProperty({ description: 'Business information', type: KYCBusinessInformation })
    businessInformation: KYCBusinessInformation;

    @Prop({ type: KYCBusinessAddress, _id: false })
    @ApiProperty({ description: 'Business address', type: KYCBusinessAddress })
    businessAddress: KYCBusinessAddress;

    @Prop({ type: [{ type: BusinessLeadershipSchema }] })
    @Type(() => BusinessLeadership)
    @ApiProperty({ description: 'Business leadership', type: [BusinessLeadership] })
    leadership: BusinessLeadership[];

    @Prop({ type: KYCDocumentation, _id: false })
    @ApiProperty({ description: 'KYC documentation', type: KYCDocumentation })
    documentation: KYCDocumentation;

    @Prop()
    @ApiProperty({ description: 'Is infrastructure owned', type: Boolean })
    infraOwned: boolean;
}

export const BusinessKYCSchema = SchemaFactory.createForClass(BusinessKYC);
export const ApiHydratedBusinessKYC = ApiHydrated(BusinessKYC);

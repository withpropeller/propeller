import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ModelSchemaOptions, Utils } from '@core/helpers';
import { Business } from '../business/business.schema';
import { Type } from 'class-transformer';
import { AWSObjectURL } from '@common/models/aws-object';
import { BusinessKYCStatus } from './business-kyc.enum';
import { enumProp } from '@core/mongo';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiHydrated } from '@common/dtos';

export enum KYCNameTitle {
    Mr = 'mr',
    Mrs = 'mrs',
    Miss = 'miss',
    Chief = 'chief',
}

export enum BusuinesRegistrationType {
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
        enum: Utils.enumToArray(BusuinesRegistrationType),
    })
    @ApiProperty({ description: 'Business registration type', enum: BusuinesRegistrationType })
    registrationType: BusuinesRegistrationType;

    @Prop()
    @ApiProperty({ description: 'Business registration number' })
    registrationNumber: string;

    @Prop()
    @ApiProperty({ description: 'Business description' })
    businessDescription: string;

    @Prop()
    @ApiPropertyOptional({ description: 'Tax identification number' })
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
    @ApiProperty({ description: 'Country code', example: 'NG' })
    countryCode: string;

    @Prop()
    @ApiProperty({ description: 'Phone number', example: '+2348123456789' })
    phone: string;

    @Prop()
    @ApiProperty({ description: 'Address line one' })
    addressLineOne: string;

    @Prop({ required: false })
    @ApiPropertyOptional({ description: 'Address line two' })
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
    @ApiProperty({ description: 'Role or title within the business' })
    role: string;

    @Prop()
    @ApiProperty({ description: 'Nationality country code', example: 'NG' })
    nationalityCode: string;

    @Prop()
    @ApiProperty({ description: 'Phone number', example: '+2348123456789' })
    phone: string;

    @Prop()
    @ApiProperty({ description: 'Email address' })
    email: string;

    @Prop()
    @ApiProperty({ description: 'Date of birth', example: '1990-01-01' })
    dateOfBirth: string;

    @Prop()
    @ApiProperty({ description: 'Bank Verification Number' })
    bvn: string;

    /** PayKKa file_id for the stakeholder identity document portrait side */
    @Prop({ required: false })
    @ApiPropertyOptional({ description: 'PayKKa file ID for identity document' })
    paykkaDocFileId?: number;
}

export const BusinessLeadershipSchema = SchemaFactory.createForClass(BusinessLeadership);

export class KYCDocumentation {
    @Prop({ type: AWSObjectURL, _id: false })
    @ApiProperty({ description: 'CAC certificate file', type: AWSObjectURL })
    cacCertificate: AWSObjectURL;

    /** PayKKa file_id returned after uploading the CAC certificate */
    @Prop({ required: false })
    @ApiPropertyOptional({ description: 'PayKKa file ID for CAC certificate' })
    cacCertificatePaykkaFileId?: number;

    @Prop({ type: AWSObjectURL, _id: false })
    @ApiProperty({ description: 'Application document file', type: AWSObjectURL })
    applicationDoc: AWSObjectURL;

    /** PayKKa file_id returned after uploading the application document */
    @Prop({ required: false })
    @ApiPropertyOptional({ description: 'PayKKa file ID for application document' })
    applicationDocPaykkaFileId?: number;
}

@Schema(ModelSchemaOptions(['business']))
export class BusinessKYC {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business' })
    @ApiProperty({ description: 'Business ID', type: String })
    business: Business;

    @Prop({ type: KYCBusinessInformation, _id: false })
    @ApiProperty({ description: 'Business information', type: KYCBusinessInformation })
    businessInformation: KYCBusinessInformation;

    @Prop({ type: KYCBusinessAddress, _id: false })
    @ApiProperty({ description: 'Business address', type: KYCBusinessAddress })
    businessAddress: KYCBusinessAddress;

    @Prop({ type: [{ type: BusinessLeadershipSchema }] })
    @Type(() => BusinessLeadership)
    @ApiProperty({ description: 'Leadership members', type: [BusinessLeadership] })
    leadership: BusinessLeadership[];

    @Prop({ type: KYCDocumentation, _id: false })
    @ApiProperty({ description: 'KYC documentation', type: KYCDocumentation })
    documentation: KYCDocumentation;

    @Prop(enumProp(BusinessKYCStatus, BusinessKYCStatus.Incomplete))
    @ApiProperty({
        description: 'KYC submission status',
        default: BusinessKYCStatus.Incomplete,
        enum: BusinessKYCStatus,
    })
    status: BusinessKYCStatus;
}

export const BusinessKYCSchema = SchemaFactory.createForClass(BusinessKYC);
export const ApiHydratedBusinessKYC = ApiHydrated(BusinessKYC);
export const ApiHydratedBusinessLeadership = ApiHydrated(BusinessLeadership);

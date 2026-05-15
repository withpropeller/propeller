import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ModelSchemaOptions, Utils } from '@core/helpers';
import { Business } from '../business/business.schema';
import { Type } from 'class-transformer';
import { AWSObjectURL } from '@common/models/aws-object';
import { BusinessKYCStatus } from './business-kyc.enum';
import { enumProp } from '@core/mongo';
import { ApiProperty } from '@nestjs/swagger';

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
    businessName: string;

    @Prop({
        type: String,
        enum: Utils.enumToArray(BusuinesRegistrationType),
    })
    registrationType: BusuinesRegistrationType;

    @Prop()
    registrationNumber: string;

    @Prop()
    businessDescription: string;

    @Prop()
    tin: string;
}

export class KYCBusinessAddress {
    @Prop()
    city: string;

    @Prop()
    state: string;

    @Prop()
    countryCode: string;

    @Prop()
    phone: string;

    @Prop()
    addressLineOne: string;

    @Prop({ required: false })
    addressLineTwo?: string;

    @Prop()
    email: string;
}

@Schema(ModelSchemaOptions())
export class BusinessLeadership {
    @Prop()
    firstName: string;

    @Prop({ required: false })
    middleName?: string;

    @Prop()
    lastName: string;

    @Prop()
    role: string;

    @Prop()
    nationalityCode: string;

    @Prop()
    phone: string;

    @Prop()
    email: string;

    @Prop()
    dateOfBirth: string;

    @Prop()
    bvn: string;

    /** PayKKa file_id for the stakeholder identity document portrait side */
    @Prop({ required: false })
    paykkaDocFileId?: number;
}

export const BusinessLeadershipSchema = SchemaFactory.createForClass(BusinessLeadership);

export class KYCDocumentation {
    @Prop({ type: AWSObjectURL, _id: false })
    cacCertificate: AWSObjectURL;

    /** PayKKa file_id returned after uploading the CAC certificate */
    @Prop({ required: false })
    cacCertificatePaykkaFileId?: number;

    @Prop({ type: AWSObjectURL, _id: false })
    applicationDoc: AWSObjectURL;

    /** PayKKa file_id returned after uploading the application document */
    @Prop({ required: false })
    applicationDocPaykkaFileId?: number;
}

@Schema(ModelSchemaOptions(['business']))
export class BusinessKYC {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business' })
    business: Business;

    @Prop({ type: KYCBusinessInformation, _id: false })
    businessInformation: KYCBusinessInformation;

    @Prop({ type: KYCBusinessAddress, _id: false })
    businessAddress: KYCBusinessAddress;

    @Prop({ type: [{ type: BusinessLeadershipSchema }] })
    @Type(() => BusinessLeadership)
    leadership: BusinessLeadership[];

    @Prop({ type: KYCDocumentation, _id: false })
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

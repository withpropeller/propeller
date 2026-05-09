import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ModelIdTag, ModelSchemaOptions, Utils } from '@core/helpers';
import { Schema as MongooseSchema } from 'mongoose';
import { Exclude, Type } from 'class-transformer';
import { ApiHydrated } from '@common/dtos';

export enum CustomerType {
    Individual = 'individual',
    Business = 'business',
}

export enum CustomerGender {
    M = 'M',
    F = 'F',
}

export enum CustomerIndividualIdentityType {
    Bvn = 'bvn',
    DriversLicense = 'drivers-license',
    Nin = 'nin',
    VotersCard = 'voters-card',
    Passport = 'passport',
}

export enum CustomerBusinessIdentityType {
    Cac = 'cac',
}

export enum CustomerVerificationType {
    Tier0 = 'tier-0',
    Tier1 = 'tier-1',
    Tier2 = 'tier-2',
    Tier3 = 'tier-3',
}

export const CustomerVerificationMinimumTier0 = [
    CustomerVerificationType.Tier0,
    CustomerVerificationType.Tier1,
    CustomerVerificationType.Tier2,
    CustomerVerificationType.Tier3,
];
export const CustomerVerificationMinimumTier1 = [
    CustomerVerificationType.Tier1,
    CustomerVerificationType.Tier2,
    CustomerVerificationType.Tier3,
];
export const CustomerVerificationMinimumTier2 = [CustomerVerificationType.Tier2, CustomerVerificationType.Tier3];
export const CustomerVerificationMinimumTier3 = [CustomerVerificationType.Tier3];

export enum CustomerVerificationStatus {
    New = 'new',
    Pending = 'pending',
    Verified = 'verified',
    DocumentRequired = 'document-required',
}

export enum CustomerStatus {
    Inactive = 'inactive',
    Active = 'active',
}

@Schema()
export class CustomerIndividualInformation {
    @Prop({ length: 50 })
    firstName?: string;

    @Prop({ length: 50 })
    lastName?: string;

    @Prop({ length: 50 })
    middleName?: string;

    @Prop()
    email?: string;

    @Prop()
    phoneNumber?: string;

    @Prop()
    title?: string;

    @Prop({ type: String, enum: Utils.enumToArray(CustomerGender) })
    gender?: string;

    @Prop()
    dateOfBirth?: string;

    @Prop()
    nationalityCode: string;
}
export const CustomerIndividualInformationSchema = SchemaFactory.createForClass(CustomerIndividualInformation);

@Schema()
export class CustomerIndividualAddress {
    @Prop()
    city?: string;

    @Prop()
    state?: string;

    @Prop()
    countryCode?: string;

    @Prop()
    addressLineOne?: string;

    @Prop()
    addressLineTwo?: string;

    @Prop()
    postalCode?: string;
}
export const CustomerIndividualAddressSchema = SchemaFactory.createForClass(CustomerIndividualAddress);

@Schema()
export class CustomerIndividualIdentity {
    @Prop({
        type: String,
        enum: Utils.enumToArray(CustomerIndividualIdentityType),
    })
    type?: string;

    @Prop()
    id?: string;

    @Prop()
    url?: string;

    @Prop()
    issuingCountry?: string;
}
export const CustomerIndividualIdentitySchema = SchemaFactory.createForClass(CustomerIndividualIdentity);

@Schema()
export class CustomerBusinessInformation {
    @Prop()
    registrationName?: string;

    @Prop()
    email?: string;

    @Prop()
    phoneNumber?: string;
}
export const CustomerBusinessInformationSchema = SchemaFactory.createForClass(CustomerBusinessInformation);

@Schema()
export class CustomerBusinessDirector {
    @Prop()
    firstName?: string;

    @Prop()
    lastName?: string;

    @Prop()
    middleName?: string;

    @Prop()
    email?: string;

    @Prop()
    phoneNumber: string;

    @Prop()
    title?: string;

    @Prop({ type: String, enum: Utils.enumToArray(CustomerGender) })
    gender?: string;

    @Prop()
    dateOfBirth?: string;

    @Prop()
    nationalityCode: string;

    @Prop({ type: CustomerIndividualIdentitySchema, _id: false })
    @Type(() => CustomerIndividualIdentity)
    @Exclude()
    identity: CustomerIndividualIdentity;
}
export const CustomerBusinessDirectorSchema = SchemaFactory.createForClass(CustomerBusinessDirector);

@Schema()
export class CustomerBusinessIdentity {
    @Prop({
        type: String,
        enum: Utils.enumToArray(CustomerBusinessIdentityType),
    })
    type: string;

    @Prop()
    id: string;

    @Prop()
    url?: string;

    @Prop()
    issuingCountry: string;
}
export const CustomerBusinessIdentitySchema = SchemaFactory.createForClass(CustomerBusinessIdentity);

@Schema()
export class CustomerClaims {
    @Prop({ type: CustomerIndividualInformationSchema, _id: false })
    @Type(() => CustomerIndividualInformation)
    @Exclude()
    individualInformation: CustomerIndividualInformation;

    @Prop({ type: CustomerIndividualAddressSchema, _id: false })
    @Type(() => CustomerIndividualAddress)
    @Exclude()
    individualAddress: CustomerIndividualAddress;

    @Prop({ type: CustomerIndividualIdentitySchema, _id: false })
    @Type(() => CustomerIndividualIdentity)
    @Exclude()
    individualIdentity: CustomerIndividualIdentity;

    @Prop({ type: CustomerBusinessInformationSchema, _id: false })
    @Type(() => CustomerBusinessInformation)
    @Exclude()
    businessInformation: CustomerBusinessInformation;

    @Prop({ type: CustomerBusinessIdentitySchema, _id: false })
    @Type(() => CustomerBusinessIdentity)
    @Exclude()
    businessIdentity: CustomerBusinessIdentity;

    @Prop({
        type: [{ type: CustomerBusinessDirectorSchema, _id: false }],
        default: void 0,
    })
    @Type(() => CustomerBusinessDirector)
    @Exclude()
    businessDirectors: CustomerBusinessDirector[];

    @Prop({ type: CustomerIndividualAddressSchema, _id: false })
    @Type(() => CustomerIndividualAddress)
    @Exclude()
    businessAddress?: CustomerIndividualAddress;
}
export const CustomerClaimsSchema = SchemaFactory.createForClass(CustomerClaims);

@Schema()
export class CustomerVerification {
    @Prop({ type: String, enum: Utils.enumToArray(CustomerVerificationType) })
    type?: CustomerVerificationType;

    @Prop({ type: String, enum: Utils.enumToArray(CustomerVerificationStatus) })
    status?: CustomerVerificationStatus;
}
export const CustomerVerificationSchema = SchemaFactory.createForClass(CustomerVerification);

export class GenericServiceIntegrations {
    @Prop({ required: true })
    id: string;

    @Prop()
    tier?: string;
}

@Schema()
export class ServiceIntegrations {
    @Prop({ type: GenericServiceIntegrations, _id: false })
    maplerad: GenericServiceIntegrations;
}

const ServiceIntegrationsSchema = SchemaFactory.createForClass(ServiceIntegrations);

@Schema(
    ModelSchemaOptions({
        objectIds: ['business:bz'],
        tag: ModelIdTag.Customer,
    }),
)
export class Customer {
    @Prop()
    name: string;

    @Prop()
    reference: string;

    @Prop({
        type: String,
        enum: Utils.enumToArray(CustomerType),
        required: true,
    })
    type: CustomerType;

    @Prop({
        type: String,
        enum: Utils.enumToArray(CustomerStatus),
        default: CustomerStatus.Active,
    })
    status: CustomerStatus;

    @Prop({ type: CustomerClaimsSchema, _id: false })
    @Type(() => CustomerClaims)
    @Exclude()
    claims: CustomerClaims;

    @Prop({
        type: [{ type: CustomerVerificationSchema, _id: false }],
        default: void 0,
    })
    @Type(() => CustomerVerification)
    verifications: CustomerVerification[];

    @Prop({ type: ServiceIntegrationsSchema, _id: false })
    @Type(() => ServiceIntegrations)
    @Exclude()
    integrations: ServiceIntegrations;

    @Prop(raw({}))
    metadata?: Record<string, any>;

    @Prop({
        type: MongooseSchema.Types.ObjectId,
        ref: 'Business',
        required: true,
    })
    business: any;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
CustomerSchema.index(
    { business: 1, reference: 1 },
    { unique: true, partialFilterExpression: { reference: { $exists: true } } },
);
export const ApiHydratedCustomer = ApiHydrated(Customer);

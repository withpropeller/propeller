import { ISO316612 } from '@common/decorators/validators.decorators';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    ArrayNotEmpty,
    IsEmail,
    IsEnum,
    IsISO31661Alpha2,
    IsNotEmpty,
    IsNotEmptyObject,
    IsObject,
    IsOptional,
    IsPhoneNumber,
    IsString,
    IsUrl,
    MaxLength,
    Validate,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import {
    CustomerBusinessIdentityType,
    CustomerGender,
    CustomerIndividualIdentityType,
    CustomerStatus,
    CustomerType,
    CustomerVerificationStatus,
    CustomerVerificationType,
} from './customer.schema';

export class CustomerIndividualInformationDto {
    @ApiProperty()
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    title?: string;

    @ApiPropertyOptional({
        description: 'Gender',
        example: 'M',
        enum: CustomerGender,
    })
    @IsEnum(CustomerGender)
    @IsOptional()
    gender?: CustomerGender;

    @ApiProperty({
        description: 'Nationality in ISO Country Code',
        example: 'NG',
    })
    @IsString()
    @IsISO31661Alpha2()
    @Transform((s) => s.value?.toUpperCase())
    nationalityCode: string;

    @ApiProperty({ description: 'First Name' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiPropertyOptional({ description: 'Middle Name' })
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    middleName?: string;

    @ApiProperty({ description: 'Last Name' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({
        description: 'Phone Number with Calling Code',
        example: '+2348123456789',
    })
    @IsPhoneNumber()
    phoneNumber: string;

    @ApiPropertyOptional({ description: 'Date of Birth' })
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    dateOfBirth: string;

    @ApiPropertyOptional({
        description: 'Email Address',
        example: 'customer@example.com',
    })
    @Transform((s) => s.value?.toLowerCase())
    @IsEmail()
    @IsOptional()
    email: string;
}

export class CustomerIndividualAddressDto {
    @ApiProperty({ description: 'Primary City', example: 'Yaba' })
    @IsString()
    @IsNotEmpty()
    city: string;

    @ApiProperty({ description: 'Primary Address Line One', example: 'Lagos' })
    @IsString()
    @Validate(ISO316612)
    @Transform((s) => s.value?.toUpperCase())
    state: string;

    @ApiProperty({ description: 'Primary Country Code', example: 'NG' })
    @IsString()
    @IsISO31661Alpha2()
    @Transform((s) => s.value?.toUpperCase())
    countryCode: string;

    @ApiProperty({
        description: 'Primary Address Line One',
        example: 'No 10, Adekunle Close',
    })
    @IsString()
    @IsNotEmpty()
    addressLineOne: string;

    @ApiPropertyOptional({
        description: 'Primary Address Line Two',
        example: 'Off Ciroma Rd',
    })
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    addressLineTwo?: string;

    @IsString()
    @IsOptional()
    @IsNotEmpty()
    postalCode?: string;
}

export class CustomerIndividualIdentityDto {
    @ApiProperty({
        description: 'Identification Type',
        example: CustomerIndividualIdentityType.Bvn,
        enum: CustomerIndividualIdentityType,
    })
    @IsEnum(CustomerIndividualIdentityType)
    type: CustomerIndividualIdentityType;

    @ApiProperty({
        description: 'Id of the identification Document',
        example: 'A015BVP13Z',
    })
    @IsString()
    @IsNotEmpty()
    id: string;

    @ApiPropertyOptional({
        description: 'Url of the uploaded Document',
        example: 'https://example.com/document.png',
    })
    @IsUrl()
    @ValidateIf((o) => o.type !== CustomerIndividualIdentityType.Bvn)
    url?: string;

    @ApiProperty({
        description: 'Issuing Country in ISO Country Code',
        example: 'NG',
    })
    @IsISO31661Alpha2()
    @Transform((s) => s.value?.toUpperCase())
    issuingCountry: string;
}

export class CustomerBusinessInformationDto {
    @ApiProperty({
        description: 'Registration Name of the Company',
        example: 'Good Mill Ltd',
    })
    @IsString()
    @IsNotEmpty()
    registrationName: string;

    @ApiProperty({
        description: 'Phone Number with Calling Code',
        example: '+2348123456789',
    })
    @IsPhoneNumber()
    phoneNumber: string;

    @ApiPropertyOptional({
        description: 'Email of the Company',
        example: 'goodmill@gmail.com',
    })
    @IsOptional()
    @IsEmail()
    email: string;
}

export class CustomerCorporateIdentityDto {
    @ApiProperty({
        description: 'Identification Type',
        example: CustomerBusinessIdentityType.Cac,
        enum: CustomerBusinessIdentityType,
    })
    @IsEnum(CustomerBusinessIdentityType)
    type: CustomerBusinessIdentityType;

    @ApiProperty({
        description: 'Registration Number of the Company',
        example: 'A015BVP13Z',
    })
    @IsString()
    @IsNotEmpty()
    id: string;

    @ApiPropertyOptional({
        description: 'Url of the uploaded Document',
        example: 'https://example.com/document.png',
    })
    @IsOptional()
    @IsUrl()
    url?: string;

    @ApiProperty({
        description: 'Issuing Country in ISO Country Code',
        example: 'NG',
    })
    @IsISO31661Alpha2()
    @Transform((s) => s.value?.toUpperCase())
    issuingCountry: string;
}

export class CustomerBusinessDirectorDto {
    @ApiProperty()
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    title?: string;

    @ApiPropertyOptional({
        description: 'Gender',
        example: 'M',
        enum: CustomerGender,
    })
    @IsEnum(CustomerGender)
    @IsOptional()
    gender?: CustomerGender;

    @ApiProperty({
        description: 'Nationality in ISO Country Code',
        example: 'NG',
    })
    @IsString()
    @IsISO31661Alpha2()
    @Transform((s) => s.value?.toUpperCase())
    nationalityCode: string;

    @ApiProperty({ description: 'First Name' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiPropertyOptional({ description: 'Middle Name' })
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    middleName?: string;

    @ApiProperty({ description: 'Last Name' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({
        description: 'Phone Number with Calling Code',
        example: '+2348123456789',
    })
    @IsPhoneNumber()
    phoneNumber: string;

    @ApiPropertyOptional({ description: 'Date of Birth' })
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    dateOfBirth: string;

    @ApiPropertyOptional({
        description: 'Email Address',
        example: 'customer@example.com',
    })
    @Transform((s) => s.value?.toLowerCase())
    @IsEmail()
    @IsOptional()
    email: string;

    @ApiProperty()
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => CustomerIndividualIdentityDto)
    identity: CustomerIndividualIdentityDto;
}

export class CustomerClaimsDto {
    @ApiProperty()
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => CustomerIndividualInformationDto)
    @IsOptional()
    individualInformation: CustomerIndividualInformationDto;

    @ApiProperty()
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => CustomerIndividualAddressDto)
    @IsOptional()
    individualAddress: CustomerIndividualAddressDto;

    @ApiProperty()
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => CustomerIndividualIdentityDto)
    @IsOptional()
    individualIdentity: CustomerIndividualIdentityDto;

    @ApiProperty()
    @IsNotEmptyObject()
    @ValidateNested()
    @IsOptional()
    @Type(() => CustomerBusinessInformationDto)
    businessInformation: CustomerBusinessInformationDto;

    @ApiProperty()
    @IsNotEmptyObject()
    @ValidateNested()
    @IsOptional()
    @Type(() => CustomerCorporateIdentityDto)
    businessIdentity: CustomerCorporateIdentityDto;

    @ApiProperty()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => CustomerBusinessDirectorDto)
    @IsOptional()
    businessDirectors: CustomerBusinessDirectorDto[];

    @ApiProperty()
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => CustomerIndividualAddressDto)
    @IsOptional()
    businessAddress: CustomerIndividualAddressDto;
}

export class CustomerVerificationDto {
    @ApiProperty({
        description: 'Verification Type',
        example: CustomerVerificationType.Tier2,
        enum: CustomerVerificationType,
    })
    @IsEnum(CustomerVerificationType)
    @IsOptional()
    type?: CustomerVerificationType;

    @ApiProperty({
        description: 'Verification Type',
        example: CustomerVerificationStatus.Verified,
        enum: CustomerVerificationStatus,
    })
    @IsEnum(CustomerVerificationStatus)
    @IsOptional()
    status?: CustomerVerificationStatus;
}

export class CustomerDto {
    @ApiProperty({ description: 'Display Name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Customer Reference',
        example: 'customer@example.com',
    })
    @IsString()
    @IsOptional()
    @MaxLength(64)
    @IsNotEmpty()
    reference?: string;

    @ApiProperty({
        description: 'Customer Type',
        example: CustomerType.Individual,
        enum: CustomerType,
    })
    @IsEnum(CustomerType)
    type: CustomerType;

    @ApiProperty()
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => CustomerClaimsDto)
    @IsOptional()
    claims?: CustomerClaimsDto;

    @ApiProperty()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => CustomerVerificationDto)
    @IsOptional()
    verifications?: CustomerVerificationDto[];

    @ApiProperty()
    @IsOptional()
    @IsObject()
    @IsNotEmptyObject()
    metadata?: Record<string, any>;
}

export class PatchCustomerDto {
    @ApiPropertyOptional({ description: 'Display Name' })
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    name: string;

    @ApiPropertyOptional({
        description: 'Customer Reference',
        example: 'customer@example.com',
    })
    @IsString()
    @IsOptional()
    @MaxLength(64)
    @IsNotEmpty()
    reference: string;

    @ApiPropertyOptional({
        description: 'Customer Type',
        example: CustomerType.Individual,
        enum: CustomerType,
    })
    @IsEnum(CustomerType)
    @IsOptional()
    type: CustomerType;

    @ApiPropertyOptional({
        description: 'Customer Status',
        example: CustomerStatus.Active,
        enum: CustomerStatus,
    })
    @IsEnum(CustomerStatus)
    @IsOptional()
    status: CustomerStatus;

    @ApiPropertyOptional()
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => CustomerClaimsDto)
    @IsOptional()
    claims: CustomerClaimsDto;

    @ApiPropertyOptional()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => CustomerVerificationDto)
    @IsOptional()
    verifications: CustomerVerificationDto[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}

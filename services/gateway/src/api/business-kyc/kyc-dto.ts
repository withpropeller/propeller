import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    ArrayNotEmpty,
    IsEmail,
    IsMongoId,
    IsOptional,
    IsPhoneNumber,
    IsString,
    IsDateString,
    MaxLength,
    MinLength,
} from 'class-validator';

export class ParamKYCLeadershipMongoIdDto {
    @ApiProperty()
    @IsMongoId()
    kycId: string;

    @ApiProperty()
    @IsMongoId()
    leadershipId: string;
}

export class KYCBusinessInformationDto {
    @ApiProperty()
    @IsString()
    businessName: string;

    @ApiProperty()
    @IsString()
    registrationType: string;

    @ApiProperty()
    @IsString()
    registrationNumber: string;

    @ApiProperty()
    @IsString()
    businessDescription: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    tin?: string;
}

export class KYCBusinessAddressDto {
    @ApiProperty({ description: 'Primary City', example: 'Yaba' })
    @IsString()
    city: string;

    @ApiProperty({ description: 'Primary Address Line One', example: 'Lagos' })
    @IsString()
    state: string;

    @ApiProperty({ description: 'Primary Country Code', example: 'NG' })
    @IsString()
    countryCode: string;

    @ApiProperty({
        description: 'Phone Number with Calling Code',
        example: '+2348123456789',
    })
    @IsPhoneNumber()
    phone: string;

    @ApiProperty({
        description: 'Primary Address Line One',
        example: 'No 10, Adekunle Close',
    })
    @IsString()
    addressLineOne: string;

    @ApiPropertyOptional({
        description: 'Primary Address Line Two',
        example: 'Off Ciroma Rd',
    })
    @IsString()
    @IsOptional()
    addressLineTwo?: string;

    @ApiProperty({
        description: 'Email Address',
        example: 'customer@example.com',
    })
    @IsEmail()
    @Transform((s) => s.value.toLowerCase())
    email: string;
}

export class KYCLeadershipDto {
    @ApiProperty({ description: 'First name', example: 'Adekunle' })
    @IsString()
    firstName: string;

    @ApiPropertyOptional({ description: 'Middle name', example: 'Ciroma' })
    @IsOptional()
    @IsString()
    middleName?: string;

    @ApiProperty({ description: 'Last name', example: 'Chukwuma' })
    @IsString()
    lastName: string;

    @ApiProperty({ description: 'Role of Individual', example: 'ceo' })
    @IsString()
    role: string;

    @ApiProperty({
        description: 'Nationality in ISO Country Code',
        example: 'NG',
    })
    @IsString()
    nationalityCode: string;

    @ApiProperty({
        description: 'Phone Number with Calling Code',
        example: '+2348123456789',
    })
    @IsPhoneNumber()
    phone: string;

    @ApiProperty({
        description: 'Email Address',
        example: 'customer@example.com',
    })
    @Transform((s) => s.value.toLowerCase())
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'Date of birth (YYYY-MM-DD)',
        example: '1990-01-15',
    })
    @IsString()
    dateOfBirth: string;

    @ApiPropertyOptional({
        description: 'BVN Identification Number',
        example: '12652782200',
    })
    @IsString()
    @MaxLength(11)
    @MinLength(11)
    bvn: string;
}

export class KYCDocumentationDto {
    @ArrayNotEmpty()
    cacCertificate: Express.Multer.File[];

    @ArrayNotEmpty()
    applicationDoc: Express.Multer.File[];
}

export class UpdateKYCDocumentationDto {
    @ArrayNotEmpty()
    @IsOptional()
    cacCertificate: Express.Multer.File[];

    @ArrayNotEmpty()
    @IsOptional()
    applicationDoc: Express.Multer.File[];
}

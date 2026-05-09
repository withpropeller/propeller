import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsString,
    IsEmail,
    IsNotEmpty,
    MinLength,
    IsUrl,
    IsOptional,
    IsBoolean,
    MaxLength,
    IsISO31661Alpha2,
} from 'class-validator';

export class OnboardSurveyDto {
    @ApiProperty({ example: 'Adekunle' })
    @IsString()
    @IsNotEmpty()
    readonly firstName: string;

    @ApiProperty({ example: 'Ciroma' })
    @IsString()
    @IsNotEmpty()
    readonly lastName: string;

    @ApiProperty({ example: 'test@test.io' })
    @IsEmail()
    @Transform((s) => s.value.toLowerCase())
    readonly email: string;

    @ApiProperty({ example: 'password' })
    @IsString()
    @Transform((s) => s.value.trim())
    @MinLength(8)
    @MaxLength(32)
    readonly password: string;

    @ApiProperty({ example: 'Allawee Inc' })
    @IsString()
    @IsOptional()
    readonly businessName: string;

    @ApiProperty({ example: true })
    @IsBoolean()
    @IsOptional()
    readonly isIncorporated: boolean;

    @ApiProperty({ example: 'www.allawee.com' })
    @IsUrl()
    @IsString()
    @IsOptional()
    readonly businessWebsite: string;

    @ApiProperty({ description: 'Primary Country Code', example: 'NG' })
    @IsISO31661Alpha2()
    readonly countryCode: string;
}

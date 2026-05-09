import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsEmail,
    IsArray,
    ArrayNotEmpty,
    IsMongoId,
    IsNotEmpty,
    IsEnum,
    IsOptional,
    IsPhoneNumber,
    ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PhoneUtils } from '@core/helpers/phone.utils';

export class InviteUserDto {
    @ApiProperty()
    @IsEmail()
    @Transform((s) => s.value.toLowerCase())
    readonly email: string;

    @ApiProperty({ example: ['admin'] })
    @IsString({ each: true })
    @IsArray()
    @ArrayNotEmpty()
    roles: string[];
}

export class InviteExternalUserDto {
    @ApiProperty({
        description: 'Phone Number with  Calling Code or Nigeria national number',
        example: '+2348123456789',
    })
    @Transform((v) => PhoneUtils.format(v.value, 'NG'))
    @IsPhoneNumber()
    readonly phone: string;

    @ApiProperty({ example: 'Adekunle' })
    @IsString()
    @IsNotEmpty()
    readonly firstName: string;

    @ApiProperty({ example: 'Ciroma' })
    @IsString()
    @IsNotEmpty()
    readonly lastName: string;

    @ApiProperty()
    @IsEmail()
    @IsOptional()
    @Transform((s) => s.value.toLowerCase())
    readonly email: string;
}

export class BulkInviteExternalUserDto {
    @ApiProperty()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => InviteExternalUserDto)
    users: InviteExternalUserDto[];
}

export class RevokeUserInviteDto {
    @ApiProperty()
    @IsMongoId()
    readonly userId: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, IsNumberString, IsOptional, MaxLength, ValidateIf, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { TwoFAChannels } from '@auth/auth.enums';

export class SigninDto {
    @ApiPropertyOptional({ example: 'test@test.io' })
    @IsEmail()
    @Transform((s) => s.value.toLowerCase())
    readonly email?: string;

    @ApiProperty({ example: 'secret' })
    @IsString()
    readonly password: string;

    @ApiPropertyOptional({ example: 123456 })
    @IsNumberString()
    @MinLength(6)
    @MaxLength(6)
    @IsOptional()
    readonly token: string;

    @ApiProperty()
    @IsEnum(TwoFAChannels)
    @ValidateIf((o) => !!o.token)
    readonly mfaChannel: TwoFAChannels;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { TwoFAChannels } from '@auth/auth.enums';

export class ChangePasswordDto {
    @ApiProperty({ example: 'password' })
    @IsString()
    @Transform((s) => s.value.trim())
    oldPassword: string;

    @ApiProperty({ example: 'password' })
    @IsString()
    @Transform((s) => s.value.trim())
    @MinLength(8)
    @MaxLength(32)
    newPassword: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    token: string;

    @ApiProperty()
    @IsEnum(TwoFAChannels)
    @ValidateIf((o) => !!o.token)
    readonly mfaChannel: TwoFAChannels;
}

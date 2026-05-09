import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class ResetPasswordDto {
    @ApiProperty({ example: 'password' })
    @IsString()
    @Transform((s) => s.value.trim())
    @MinLength(8)
    @MaxLength(32)
    newPassword: string;
}

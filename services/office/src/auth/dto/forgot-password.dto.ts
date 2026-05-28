import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
    @ApiProperty({ example: 'test@hyphenmoney.com' })
    @IsEmail()
    @Transform((s) => s.value.toLowerCase())
    email: string;
}

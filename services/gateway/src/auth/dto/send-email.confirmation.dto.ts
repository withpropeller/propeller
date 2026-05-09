import { IsEmail, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class SendEmailConfirmationDto {
    @ApiPropertyOptional({ example: 'test@test.io' })
    @IsEmail()
    @Transform((s) => s.value.toLowerCase())
    @IsOptional()
    readonly email?: string;
}

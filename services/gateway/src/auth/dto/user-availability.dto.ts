import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsPhoneNumber, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class UserAvailabilityDto {
    @ApiPropertyOptional({ example: 'test@test.io' })
    @IsEmail()
    @ValidateIf((o) => !o.phone)
    @Transform((s) => s.value.toLowerCase())
    @IsOptional()
    readonly email?: string;

    @ApiPropertyOptional({ example: '+2348189681252' })
    @IsPhoneNumber('ZZ' as any)
    @ValidateIf((o) => !o.phone)
    @IsOptional()
    readonly phone?: string;
}

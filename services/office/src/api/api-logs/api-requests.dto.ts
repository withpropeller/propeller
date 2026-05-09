import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class RequestRetryDto {
    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    forceHardStop: string;
}

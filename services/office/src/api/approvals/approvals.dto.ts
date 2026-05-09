import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApprovalDecisionDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    remarks: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    exchangeRateHash?: string;
}

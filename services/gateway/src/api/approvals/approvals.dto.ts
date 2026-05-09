import { MoneyAmount } from '@common/decorators/validators.decorators';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Validate } from 'class-validator';

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

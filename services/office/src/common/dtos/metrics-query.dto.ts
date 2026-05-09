import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class MetricsQueryDto {
    @ApiPropertyOptional({ description: 'Filter from date (ISO 8601)', example: '2026-01-01T00:00:00Z' })
    @IsDateString()
    @IsOptional()
    from?: string;

    @ApiPropertyOptional({ description: 'Filter to date (ISO 8601)', example: '2026-12-31T23:59:59Z' })
    @IsDateString()
    @IsOptional()
    to?: string;
}

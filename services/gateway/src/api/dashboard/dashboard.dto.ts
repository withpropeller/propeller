import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class DashboardMetricsQueryDto {
    @ApiPropertyOptional({
        description: 'Period for treasury stats',
        enum: ['7d', '30d', '90d'],
        default: '7d',
    })
    @IsOptional()
    @IsIn(['7d', '30d', '90d'])
    period?: '7d' | '30d' | '90d';
}

export class TreasuryVolumeStatsDto {
    @ApiProperty({ description: 'Total amount in lowest currency unit (kobo)' })
    total: number;

    @ApiProperty({ description: 'Percentage change vs previous period', nullable: true })
    change: number | null;
}

export class TreasuryCountChangeStatsDto {
    @ApiProperty({ description: 'Count' })
    count: number;

    @ApiProperty({ description: 'Percentage change vs previous period', nullable: true })
    change: number | null;
}

export class TreasuryRateChangeStatsDto {
    @ApiProperty({ description: 'Rate (percent)' })
    rate: number;

    @ApiProperty({ description: 'Absolute change vs previous period (percentage points)', nullable: true })
    change: number | null;
}

export class TreasuryDailyVolumeStatDto {
    @ApiProperty({ description: 'Date (ISO date)' })
    date: string;

    @ApiProperty({ description: 'Total collected on this day (kobo)' })
    total: number;
}

export class TreasuryFlowSplitStatDto {
    @ApiProperty({ description: 'Flow label', example: 'Pay-in' })
    name: string;

    @ApiProperty({ description: 'Transaction count' })
    count: number;

    @ApiProperty({ description: 'Volume in lowest currency unit (kobo)' })
    total: number;

    @ApiProperty({ description: 'Share of total flow count (percent)' })
    percent: number;
}

export class TreasuryStatusStatDto {
    @ApiProperty({ description: 'Payment status', example: 'successful' })
    status: string;

    @ApiProperty({ description: 'Payment count' })
    count: number;

    @ApiProperty({ description: 'Share of payments (percent)' })
    percent: number;
}

export class DashboardMetricsResponseDto {
    @ApiProperty({ description: 'Currency code', example: 'NGN' })
    currency: string;

    @ApiProperty({ description: 'Pay-in collections volume' })
    collections: TreasuryVolumeStatsDto;

    @ApiProperty({ description: 'Daily pay-in collections volume', type: [TreasuryDailyVolumeStatDto] })
    dailyCollections: TreasuryDailyVolumeStatDto[];

    @ApiProperty({ description: 'Successful pay-in count' })
    payIns: TreasuryCountChangeStatsDto;

    @ApiProperty({ description: 'Failed or abandoned pay-in count' })
    payInFailures: TreasuryCountChangeStatsDto;

    @ApiProperty({ description: 'Pay-in success rate' })
    successRate: TreasuryRateChangeStatsDto;

    @ApiProperty({ description: 'Pay-in vs pay-out flow split', type: [TreasuryFlowSplitStatDto] })
    flowSplit: TreasuryFlowSplitStatDto[];

    @ApiProperty({ description: 'Payments grouped by status', type: [TreasuryStatusStatDto] })
    byStatus: TreasuryStatusStatDto[];

    @ApiProperty({ description: 'Available collected balance (kobo)' })
    availableBalance: number;

    @ApiProperty({ description: 'Balance reserved for pending payouts (kobo)' })
    pendingPayout: number;
}

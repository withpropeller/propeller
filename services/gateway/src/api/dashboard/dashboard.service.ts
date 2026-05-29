import { Injectable } from '@nestjs/common';
import { subDays, format } from 'date-fns';
import { DashboardMetricsQueryDto, DashboardMetricsResponseDto, TreasuryDailyVolumeStatDto } from './dashboard.dto';

const PERIOD_DAYS: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
};

/**
 * Treasury dashboard metrics.
 *
 * Stub implementation — replace with TigerBeetle projections + payment aggregates.
 */
@Injectable()
export class DashboardService {
    getMetrics(query: DashboardMetricsQueryDto): DashboardMetricsResponseDto {
        const period = query.period ?? '7d';
        const days = PERIOD_DAYS[period] ?? 7;
        const dailyCollections = this.buildDailySeries(days);

        return {
            currency: 'NGN',
            collections: { total: 0, change: null },
            dailyCollections,
            payIns: { count: 0, change: null },
            payInFailures: { count: 0, change: null },
            successRate: { rate: 0, change: null },
            flowSplit: [
                { name: 'Pay-in', count: 0, total: 0, percent: 0 },
                { name: 'Pay-out', count: 0, total: 0, percent: 0 },
            ],
            byStatus: [
                { status: 'successful', count: 0, percent: 0 },
                { status: 'processing', count: 0, percent: 0 },
                { status: 'failed', count: 0, percent: 0 },
            ],
            availableBalance: 0,
            pendingPayout: 0,
        };
    }

    private buildDailySeries(days: number): TreasuryDailyVolumeStatDto[] {
        const today = new Date();
        const series: TreasuryDailyVolumeStatDto[] = [];

        for (let i = days - 1; i >= 0; i--) {
            series.push({
                date: format(subDays(today, i), 'yyyy-MM-dd'),
                total: 0,
            });
        }

        return series;
    }
}

import { ApiProperty } from '@nestjs/swagger';

export class CardAuthMetricsByCurrencyDto {
    @ApiProperty({ description: 'Currency code' })
    _id: string;

    @ApiProperty({ description: 'Total authorized amount in lowest currency unit', type: Number })
    totalAmount: number;

    @ApiProperty({ description: 'Number of authorizations', type: Number })
    count: number;
}

export class CardAuthMetricsDto {
    @ApiProperty({
        description: 'Authorization counts grouped by status',
        type: Object,
        example: { pending: 5, approved: 120, declined: 30, reversed: 10 },
    })
    byStatus: Record<string, number>;

    @ApiProperty({
        description: 'Authorization counts grouped by decline reason',
        type: Object,
        example: { 'insufficient-funds': 18, 'spending-control': 7 },
    })
    byDeclineReason: Record<string, number>;

    @ApiProperty({
        description: 'Authorization counts grouped by type',
        type: Object,
        example: { capture: 100, check: 55 },
    })
    byType: Record<string, number>;

    @ApiProperty({
        description: 'Authorization counts grouped by decision type',
        type: Object,
        example: { 'direct-response': 80, 'system-response': 75 },
    })
    byDecisionType: Record<string, number>;

    @ApiProperty({ description: 'Volume and count breakdown by currency', type: [CardAuthMetricsByCurrencyDto] })
    byCurrency: CardAuthMetricsByCurrencyDto[];

    @ApiProperty({ description: 'Total number of authorizations', type: Number })
    total: number;
}

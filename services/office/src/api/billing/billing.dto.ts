import { ApiProperty } from '@nestjs/swagger';

export class BillingMetricsByCurrencyDto {
    @ApiProperty({ description: 'Currency code' })
    _id: string;

    @ApiProperty({ description: 'Total billed amount in lowest currency unit', type: Number })
    totalBilledAmount: number;

    @ApiProperty({ description: 'Number of billings', type: Number })
    count: number;
}

export class BillingMetricsDto {
    @ApiProperty({
        description: 'Billing counts grouped by status',
        type: Object,
        example: { paid: 80, due: 15, pending: 5 },
    })
    byStatus: Record<string, number>;

    @ApiProperty({ description: 'Billing totals grouped by currency', type: [BillingMetricsByCurrencyDto] })
    byCurrency: BillingMetricsByCurrencyDto[];

    @ApiProperty({ description: 'Total number of billings', type: Number })
    total: number;
}

import { ApiProperty } from '@nestjs/swagger';

export class ApiLogsMetricsDto {
    @ApiProperty({
        description: 'API request counts grouped by status',
        type: Object,
        example: { completed: 150, pending: 5 },
    })
    byStatus: Record<string, number>;

    @ApiProperty({
        description: 'API request counts grouped by HTTP method',
        type: Object,
        example: { GET: 80, POST: 75 },
    })
    byMethod: Record<string, number>;

    @ApiProperty({ description: 'Total number of API requests', type: Number })
    total: number;
}

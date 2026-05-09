import { ApiProperty } from '@nestjs/swagger';

export class CardMetricsDto {
    @ApiProperty({ description: 'Card counts grouped by status', type: Object, example: { active: 30, blocked: 5 } })
    byStatus: Record<string, number>;

    @ApiProperty({ description: 'Card counts grouped by type', type: Object, example: { virtual: 25, physical: 10 } })
    byType: Record<string, number>;

    @ApiProperty({ description: 'Card counts grouped by network', type: Object, example: { mastercard: 20, visa: 15 } })
    byNetwork: Record<string, number>;

    @ApiProperty({ description: 'Total number of cards', type: Number })
    total: number;
}

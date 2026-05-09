import { ApiProperty } from '@nestjs/swagger';
import { MaxLength } from 'class-validator';

export class BusinessMetricsDto {
    @ApiProperty({
        description: 'Business counts grouped by status',
        type: Object,
        example: { approved: 10, 'not-approved': 5 },
    })
    byStatus: Record<string, number>;

    @ApiProperty({ description: 'Total number of businesses', type: Number })
    total: number;
}

export class ApproveBusinessDto {
    @ApiProperty()
    @MaxLength(26)
    accountName: string;
}

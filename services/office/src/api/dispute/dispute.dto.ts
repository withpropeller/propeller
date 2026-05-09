import { TagMap } from '@core/helpers';
import { ArrayNotEmpty, IsOptional, IsString, IsUrl, Validate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsTagMap } from '@common/decorators/validators.decorators';
import { Transform } from 'class-transformer';
import { ModelIdTag, ParseTagMap } from '@core/mongo';

export class UpdateDisputeDto {
    @ApiPropertyOptional({ example: 'I did not receive my order' })
    @IsString()
    @IsOptional()
    text?: string;

    @ApiPropertyOptional({ example: ['https://s3.amazonaws.com/...'] })
    @ArrayNotEmpty()
    @IsUrl({}, { each: true })
    @IsOptional()
    documents?: string[];

    @ApiPropertyOptional({ example: 'usr.2cbc123456' })
    @Transform((v) => ParseTagMap(v.value, [ModelIdTag.User]))
    @Validate(IsTagMap)
    @IsOptional()
    actor?: TagMap;
}

export class DisputeMetricsByCurrencyDto {
    @ApiProperty({ description: 'Currency code' })
    _id: string;

    @ApiProperty({ description: 'Total dispute amount in lowest currency unit', type: Number })
    totalAmount: number;

    @ApiProperty({ description: 'Number of disputes', type: Number })
    count: number;
}

export class DisputeMetricsDto {
    @ApiProperty({ description: 'Dispute counts grouped by status', type: Object, example: { new: 12, closed: 5 } })
    byStatus: Record<string, number>;

    @ApiProperty({
        description: 'Dispute counts grouped by reason',
        type: Object,
        example: { fraudulent: 8, duplicate: 4 },
    })
    byReason: Record<string, number>;

    @ApiProperty({ description: 'Dispute totals grouped by currency', type: [DisputeMetricsByCurrencyDto] })
    byCurrency: DisputeMetricsByCurrencyDto[];

    @ApiProperty({ description: 'Total number of disputes', type: Number })
    total: number;
}

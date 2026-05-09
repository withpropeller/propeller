import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';

export class PaymentMetricsByCurrencyDto {
    @ApiProperty({ description: 'Currency code', type: String })
    _id: string;

    @ApiProperty({ description: 'Total payment amount in lowest currency unit', type: Number })
    totalAmount: number;

    @ApiProperty({ description: 'Number of payments', type: Number })
    count: number;
}

export class PaymentMetricsDto {
    @ApiProperty({ description: 'Payment counts grouped by status', type: Object, example: { success: 20, failed: 5 } })
    byStatus: Record<string, number>;

    @ApiProperty({ description: 'Payment counts grouped by type', type: Object, example: { 'pay-in': 14, 'pay-out': 11 } })
    byType: Record<string, number>;

    @ApiProperty({ description: 'Payment totals grouped by currency', type: [PaymentMetricsByCurrencyDto] })
    byCurrency: PaymentMetricsByCurrencyDto[];

    @ApiProperty({ description: 'Total number of payments', type: Number })
    total: number;
}

export class ForceChargeDto {
    @ApiProperty({ example: 'remarks here' })
    @IsString()
    @IsNotEmpty()
    remarks: string;
}

export class RefundPaymentDto {
    @ApiProperty({ example: 'remarks here' })
    @IsString()
    @IsNotEmpty()
    remarks: string;
}

export class UpdateProcessorDataDto {
    @ApiProperty({ example: true })
    @IsBoolean()
    @IsOptional()
    markedAsNotFound: boolean;

    @ApiProperty({ example: true })
    @IsBoolean()
    @IsOptional()
    markedAsDebited: boolean;

    @ApiProperty({ example: true })
    @IsBoolean()
    @IsOptional()
    markedAsReversed: boolean;

    @ApiProperty({ example: true })
    @IsBoolean()
    @IsOptional()
    validated: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReconcileQueryDto {
    @ApiPropertyOptional({ description: 'Filter by match status' })
    @IsOptional()
    @IsString()
    matchStatus?: string;
}

export class ReconciliationTotalsDto {
    @ApiProperty({ description: 'Total debit amount in kobo', type: Number })
    totalDebit: number;

    @ApiProperty({ description: 'Total credit amount in kobo', type: Number })
    totalCredit: number;

    @ApiProperty({ description: 'Matched debit amount in kobo', type: Number })
    matchedDebit: number;

    @ApiProperty({ description: 'Matched credit amount in kobo', type: Number })
    matchedCredit: number;

    @ApiProperty({ description: 'Unmatched debit amount in kobo', type: Number })
    unmatchedDebit: number;

    @ApiProperty({ description: 'Unmatched credit amount in kobo', type: Number })
    unmatchedCredit: number;
}

export class ReconciliationMetricsDto {
    @ApiProperty({
        description: 'Statement counts by match status',
        type: Object,
        example: { matched: 300, unmatched: 40, skipped: 5 },
    })
    byMatchStatus: Record<string, number>;

    @ApiProperty({
        description: 'Matched statement counts by source type',
        type: Object,
        example: { CardAuthorization: 250, Payment: 50 },
    })
    bySourceRef: Record<string, number>;

    @ApiProperty({ description: 'Aggregate debit/credit totals', type: ReconciliationTotalsDto })
    totals: ReconciliationTotalsDto;

    @ApiProperty({ description: 'Total number of statements', type: Number })
    total: number;
}

export class PatchStatementDto {
    @ApiProperty({
        description: 'The corrected raw CSV row exactly as it appears in the Providus bank statement file',
        example:
            '03/05/2025,03/05/2025,"POINT OF SALE PURCHASE TRANSACTION   POS@<22148F55> <2214LA877589020> <CENTEPA LIMITED (OPERAT"""41, ST FINXXNG> <400339/941895>",03/05/2025,"13,150.00",,"5,811,462.05",,9999941895',
    })
    @IsNotEmpty()
    @IsString()
    rawCsvRow: string;
}

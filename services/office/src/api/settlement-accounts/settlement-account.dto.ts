import { IsTagId, MoneyAmount } from '@common/decorators/validators.decorators';
import { Utils } from '@core/helpers';
import { ModelIdTag, ParseTagId } from '@core/mongo';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Validate } from 'class-validator';
import { Types } from 'mongoose';
import { MetricsQueryDto } from '@common/dtos';

export class SettlementAccountBalanceDto {
    @ApiProperty({ description: 'Settlement account ID', example: 'sac.2y467asaeB4ynK64F' })
    id: string;

    @ApiProperty({ description: 'Settlement account name', example: 'Paystack Settlement Account' })
    name: string;

    @ApiProperty({ description: 'Available balance', type: Number, example: 2613541322 })
    available: number;

    @ApiProperty({ description: 'Object type', example: 'settlement.account.balance' })
    object: string;
}

export class TransferSettlementAccountDto {
    @ApiProperty({ description: 'Amount to transfer in lowest currency unit' })
    @Transform((v) => Utils.safeNumber(v.value))
    @Validate(MoneyAmount)
    amount: number;

    @ApiProperty({ description: 'Settlement account ID to transfer to', example: 'sac.2cbc123456' })
    @Transform((v) => ParseTagId(v.value, [ModelIdTag.SettlementAccount]))
    @Validate(IsTagId)
    settlementAccount: Types.ObjectId;
}

export class SettlementLogMetricsByCurrencyDto {
    @ApiProperty({ description: 'Currency code' })
    _id: string;

    @ApiProperty({ description: 'Total credit (debit mode) volume in lowest unit', type: Number })
    totalCredit: number;

    @ApiProperty({ description: 'Total debit (credit mode) volume in lowest unit', type: Number })
    totalDebit: number;

    @ApiProperty({ description: 'Net change amount in lowest unit', type: Number })
    netChange: number;

    @ApiProperty({ description: 'Number of credit entries', type: Number })
    creditCount: number;

    @ApiProperty({ description: 'Number of debit entries', type: Number })
    debitCount: number;
}

export class SettlementLogMetricsDto {
    @ApiProperty({
        description: 'Transaction counts grouped by mode',
        type: Object,
        example: { debit: 40, credit: 20 },
    })
    byMode: Record<string, number>;

    @ApiProperty({ description: 'Volume and count breakdown by currency', type: [SettlementLogMetricsByCurrencyDto] })
    byCurrency: SettlementLogMetricsByCurrencyDto[];

    @ApiProperty({ description: 'Total number of log entries', type: Number })
    total: number;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionCurrency } from '@api/transactions/transactions.enums';
import { PaymentMethod } from './payment.schema';

export class CreatePayoutPaymentOptionsDto {
    @ApiPropertyOptional({ enum: PaymentMethod, example: PaymentMethod.BankTransfer })
    method?: PaymentMethod;

    @ApiPropertyOptional({ example: '0123456789' })
    accountNumber?: string;

    @ApiPropertyOptional({ example: '001' })
    bankCode?: string;

    @ApiPropertyOptional()
    narration?: string;

    @ApiPropertyOptional()
    note?: string;

    @ApiPropertyOptional({ example: 'ac.2cbc123456', description: 'Destination account ID' })
    destination?: string;
}

export class CreatePayoutPaymentDto {
    @ApiPropertyOptional({ enum: PaymentMethod, example: PaymentMethod.BankTransfer })
    method?: PaymentMethod;

    @ApiProperty({ type: CreatePayoutPaymentOptionsDto })
    options: CreatePayoutPaymentOptionsDto;

    @ApiProperty({ enum: TransactionCurrency, example: TransactionCurrency.NGN })
    currency: TransactionCurrency;

    @ApiProperty({ example: 10000 })
    amount: number;

    @ApiPropertyOptional()
    reference?: string;

    @ApiPropertyOptional()
    narration?: string;

    @ApiPropertyOptional({ example: 'ac.2cbc123456', description: 'Debit source account ID' })
    debitSource?: string;

    @ApiPropertyOptional({ type: Object })
    metadata?: Record<string, any>;
}

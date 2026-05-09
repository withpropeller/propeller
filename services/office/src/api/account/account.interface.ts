import { TransactionCurrency } from '@api/transactions/transactions.enums';

export interface ReleaseLienDto {
    accountId: string;
    source: string;
    currency: TransactionCurrency;
    lienAmount: number;
}

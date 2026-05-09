import { TransactionCurrency } from '@api/transactions/transactions.enums';

export interface ISVOptions {
    dryRun?: boolean;
}

export interface PlaceLienDto {
    accountId: string;
    source: string;
    currency: TransactionCurrency;
    amount: number;
    fees: number;
}

export interface ReleaseLienDto {
    accountId: string;
    source: string;
    currency: TransactionCurrency;
    lienAmount: number;
}

export enum EnvoyResponseCode {
    Success = 'success',
    Error = 'error',
}

export interface StaticEnvoyResponse {
    code: EnvoyResponseCode;
    data: {
        createdAt: string;
        keyName: string;
        url: string;
        bytes: string;
    };
}

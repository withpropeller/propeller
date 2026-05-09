import { FeeBreakdown } from '@api/fees/fee.schema';
import { TransactionProcessor } from '@api/transactions/transactions.enums';

export interface CommercialBank {
    code: string;
    processorCode?: string;
    name: string;
    abbr: string;
    rank: number;
    imageUrl: string;
}

export interface ProcessorBankMapping {
    code: string;
    processorCode: string;
}

export interface ResolvedAccount {
    name: string;
    bank?: CommercialBank;
    bvn?: string;
    kyc?: string;
    nipSessionId?: string;
}

export interface IBankResolveIntegration {
    processor: TransactionProcessor;
    getBankList(): Promise<CommercialBank[]>;
    resolveBankAccount(accountNumber: string, bankCode: string): Promise<ResolvedAccount>;
}

export interface IFeesBreakdown {
    totalFees: number;
    feesBreakdown: FeeBreakdown[];
    processor: TransactionProcessor;
}

export interface ITransferBreakdown extends IFeesBreakdown {
    resolvedAccount: ResolvedAccount;
}

import { FeeBreakdown } from '@api/fees/fee.schema';
import { TransactionProcessor } from '@api/transactions/transactions.enums';
import { RResponse } from '@common/services';

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
    bvn?: string;
    kyc?: string;
    nipSessionId?: string;
}

export interface ITransferSettings {
    processor: TransactionProcessor;
    feeTiers: Array<{ limit: number; fee: number }>;
}

export interface IBankResolveIntegration {
    processor: TransactionProcessor;
    getBankList(): Promise<CommercialBank[]>;
    resolveBankAccount(accountNumber: string, bankCode: string): Promise<ResolvedAccount>;
}

export interface IBankSettlementIntegration {
    repushSettlement(data: any): Promise<string>;
    retriggerManualSettlement(sessionId: string): Promise<RResponse>;
}

export interface IFeesBreakdown {
    totalFees: number;
    feesBreakdown: FeeBreakdown[];
    processor: TransactionProcessor;
}

export interface ITransferBreakdown extends IFeesBreakdown {
    resolvedAccount: ResolvedAccount;
}

export interface IProvidusCollectionEventBody {
    accountNumber: string;
    settledAmount: string;
    vatAmount: string;
    currency: string;
    tranRemarks: string;
    transactionAmount: string;
    settlementId: string;
    sessionId: string;
    sourceBankName: string;
    sourceBankCode: string;
    sourceAccountNumber: string;
    sourceAccountName: string;
    tranDateTime: string;
    initiationTranRef: string;
    channelId: string;
}

export interface IProvidusCollectionTransaction {
    accountNumber: string;
    settledAmount: number;
    vatAmount: number;
    currency: string;
    tranRemarks: string;
    feeAmount: number;
    transactionAmount: number;
    settlementId: string;
    sessionId: string;
    sourceBankName: string;
    sourceBankCode: string;
    sourceAccountNumber: string;
    sourceAccountName: string;
    tranDateTime: string;
    initiationTranRef: string;
    channelId: string;
}

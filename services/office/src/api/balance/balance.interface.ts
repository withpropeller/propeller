import { Types } from 'mongoose';
import { AccountCurrency } from '@api/account/account.enums';
import { PaymentType } from '@api/payments/payment.enums';
import { TransactionCurrency } from '@api/transactions/transactions.enums';

export interface CreateAccountBalanceDto {
    account: Types.ObjectId;
    business: Types.ObjectId;
    currency: AccountCurrency;
}

export interface CreateReserveAccountBalanceDto {
    reserveAccount: Types.ObjectId;
    currency: AccountCurrency;
}

export const BankTransferTransactionTypes = [PaymentType.PayOut];

export interface CreateAccountBalanceDto {
    currency: AccountCurrency;
    account: Types.ObjectId;
    business: Types.ObjectId;
}

export interface BalanceStatementEntry {
    timezone: string;

    typeDescriptor: string;

    txTimeUTC: string;
    txDate: string;
    txHourTime: string;

    isReversal: boolean;
    reference: string;

    mode: string;
    currency: string;
    description: string;
    remarks: string;
    narration: string;
    signedAmount: number;
    balanceBefore: number;
    balanceAfter: number;
    moneyBalanceBefore: string;
    moneyBalanceAfter: string;

    amount: number;
    moneyAmount: string;
    fees: number;
    moneyFees: string;
    signedFees: number;
    total: number;
    signedTotal: number;
    moneyTotal: string;
    amountIn: number;
    moneyIn: string;
    amountOut: number;
    moneyOut: string;

    payeeName: string;
}

export interface BalanceStatementAggregatedDoc {
    txTime: number;
    available: number;
    availableChange: number;
    isReversal: boolean;
    source: {
        sourceId: Types.ObjectId;
        sourceRef: string;
        reference: string;
        sessionId: string;
        description: string;
        type: string;
        amount: number;
        fees: number;
        data: {
            narration: string;
            beneficiary: {
                accountNumber: string;
            };
            channel: string;
        };
    };
    beneficiary: {
        accountName: string;
        accountNumber: string;
        bankCode: string;
        bankName: string;
        imageUrl: string;
        name: string;
    };
    createdAt: string;
    currency: TransactionCurrency;
    holding: {
        name: string;
        last4?: string;
        network: string;
    };
    holdingRef: string;
    mode: string;
    status: string;
    timeline: {
        action: string;
        createdAt: Date;
    }[];
}

export interface BalanceHistoryAggregatedDoc {
    available: number;
    availableChange: number;
    mode: string;
    currency: string;
    transaction: {
        description: string;
        type: string;
    };
    txTime: Date;
    beneficiary: string;
}

export interface BalanceHistoryEntry {
    source: string;
    typeDescriptor: string;
    txTimeUTC: string;
    reference: string;
    mode: string;
    currency: string;
    description: string;
    balanceBefore: number;
    balanceAfter: number;
    signedTotal: number;
}

export interface TransactionStatementDataPayee {
    name: string;
    abbr: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
    bankImageUrl: string;
}

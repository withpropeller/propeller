import { AccountCurrency } from '@api/account/account.enums';
import { PaymentMethod, PaymentType } from '@api/payments/payment.enums';
import { TransactionCurrency } from '@api/transactions/transactions.enums';
import { Types } from 'mongoose';

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
        method: PaymentMethod;
        reference: string;
        description: string;
        type: string;
        amount: number;
        fees: number;
        data: {
            reference: string;
            stan: string;
            rrn: string;
            terminalId: string;
            merchantDescriptor: string;
            sessionId: string;
            narration: string;
            accountName: string;
            bankName: string;
            accountNumber: string;
            channel: string;
            fxChargeAmount: number;
            fxChargeType: string;
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
    narration: string;
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

export interface BalanceStatementData {
    statementPeriod: {
        from: string;
        to: string;
    };
    customerDetails: {
        customerName: string;
        addressLine1: string;
        addressLine2: string;
    };
    accountDetails: {
        accountName: string;
        accountNumber: string;
        accountType: string;
        currency: AccountCurrency;
    };
    accountSummary: {
        openingBalance: number;
        closingBalance: number;
        totalDeposits: number;
        totalWithdrawals: number;
    };
    transactions: BalanceStatementTransaction[];
}

export interface BalanceStatementTransaction {
    date: string;
    timeStr: string;
    description: string;
    narration: string;
    amount: number;
    amountIn: number;
    amountOut: number;
    type: string;
    reference: string;
    balanceBefore: number;
    balanceAfter: number;
}

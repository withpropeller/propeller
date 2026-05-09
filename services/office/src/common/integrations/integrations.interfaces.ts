import { VirtualAccountPartner } from '@api/account/account.enums';
import { PaymentStatus } from '@api/payments/payment.enums';
import { Payment } from '@api/payments/payment.schema';
import { TransactionCurrency, TransactionProcessor } from '@api/transactions/transactions.enums';
import { HydratedDocument } from 'mongoose';

export interface InterswitchResponse {
    access_token: string;
    responseCode: string;
    responseMessage: string;
    pin: string;
    error: any;
}

export interface MapleradResponse {
    status: boolean;
    data: any;
}

export interface MapleradCardResponse {
    status: boolean;
    data: {
        id: string;
        name: string;
        card_number: string;
        masked_pan: string;
        expiry: string;
        cvv: string;
        balance: number;
        address: {
            street: string;
            city: string;
            state: string;
            postal_code: string;
            country: string;
        };
    };
}

export interface FxQuote {
    fromCurrency: TransactionCurrency;
    toCurrency: TransactionCurrency;
    fromAmount: number;
    toAmount: number;
    hash?: string;
    rate: number;
    feeRate: number;
    feeAmount?: number;
    originalRate?: number;
}

export interface MapleradFxQuote {
    rate: number;
    from: TransactionCurrency;
    to: TransactionCurrency;
    reference: string;
}

export interface PavilionCard {
    Id: string;
    AccountNumber: string;
    Cardholder: string;
    MaskedPan: string;
}

export interface ProcessorPaymentFinalStatusData {
    status: PaymentStatus;
    data?: any;
    error?: any;
}
export interface ITransferIntegration {
    getStatus(reference: HydratedDocument<Payment>): Promise<ProcessorPaymentFinalStatusData>;
    getStatus(reference: HydratedDocument<Payment>): Promise<ProcessorPaymentFinalStatusData>;
}

export interface ICollectionAccountIntegration {
    processor: TransactionProcessor;
    createDepositChannel(name: string, dynamic: boolean): Promise<ICollectionAccountResult>;
    updateDepositChannel(accountNumber: string, accountName: string): Promise<string>;
    getSettlementAccountBalance(): Promise<number>;
}

export interface ICollectionAccountResult {
    accountNumber: string;
    accountName: string;
    bankName: string;
    bankCode: string;
    partner: VirtualAccountPartner;
}

export interface ISettlementAccountIntegration {
    processor: TransactionProcessor;
    getSettlementAccountBalance(identifier?: string): Promise<number>;
}

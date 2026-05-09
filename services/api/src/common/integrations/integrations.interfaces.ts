import { TransactionCurrency, TransactionProcessor } from '@api/transactions/transactions.enums';
import { ExecutionOptions, ExecutionOptionsWithRequest } from '@common/interfaces';
import { PaymentRequest, PaymentRequestProcessorData } from '@api/payment-requests/payment-request.schema';
import { HydratedDocument } from 'mongoose';
import { VirtualAccountPartner } from '@api/account/account.enums';

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

export enum IntegrationErrors {
    ProvidusError = 'providus-error',
    MapleradError = 'maplerad-error',
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

export interface ProvidusCardDetailsResponse {
    Id: string;
    IssuedAt: string;
    MaskedPan: string;
    CardHolder: string;
    Batch: string;
    Expiry: string;
}

export interface ProvidusCardLinkResponse {
    Id: string;
    ResponseCode: string;
    ResponseMessage: string;
    Expiry: string;
}

export enum ProvidusCardAccountType {
    Savings = 1,
    Current = 2,
}

export interface INibssDirectDebitIntegration {
    processor: TransactionProcessor;
    createMandate(
        email: string,
        callbackUrl: string,
        options: ExecutionOptionsWithRequest,
    ): Promise<Record<string, any>>;

    revokeMandate(authCode: string, options?: ExecutionOptions): Promise<boolean>;
    chargeMandate(
        paymentAuth: any,
        paymentRequest: HydratedDocument<PaymentRequest>,
        options: ExecutionOptionsWithRequest,
    ): Promise<PaymentRequestProcessorData>;
}

export interface ICollectionAccountIntegration {
    processor: TransactionProcessor;
    createDepositChannel(name: string, dynamic: boolean): Promise<ICollectionAccountResult>;
    updateDepositChannel(accountNumber: string, accountName: string): Promise<string>;
}

export interface ICollectionAccountResult {
    accountNumber: string;
    accountName: string;
    bankName: string;
    bankCode: string;
    partner: VirtualAccountPartner;
}

export enum TransactionMode {
    Credit = 'credit',
    Debit = 'debit',
    PlaceLien = 'place-lien',
    DebitLien = 'debit-lien',
    ReverseLien = 'reverse-lien',
}

export function ShortTransactionMode(mode: TransactionMode) {
    if (mode === TransactionMode.Credit) {
        return 'CR';
    }

    if (mode === TransactionMode.Debit) {
        return 'DR';
    }

    return mode;
}

export const TransactionModeIncongitos = [TransactionMode.PlaceLien, TransactionMode.ReverseLien];

export enum TransactionCurrency {
    USD = 'USD',
    NGN = 'NGN',
}

export enum TransactionChannels {
    ATM = 'ATM',
    POS = 'POS',
    ONLINE = 'ONLINE',
}

export enum TransactionType {
    AccountFunding = 'ACCOUNT_FUNDING',
    CardFunding = 'CARD_FUNDING',
    CardAccountFunding = 'CARD_ACCOUNT_FUNDING',
    CardAccountDefunding = 'CARD_ACCOUNT_DEFUNDING',
    WalletFunding = 'WALLET_FUNDING',
    WalletDefunding = 'WALLET_DEFUNDING',
    CardOrder = 'CARD_ORDER',
    AccountTransfer = 'ACCOUNT_TRANSFER',
    BankTransfer = 'BANK_TRANSFER',
    CardDefunding = 'CARD_DEFUNDING',
    CardCharge = 'CARD_CHARGE',
    BillPayment = 'BILL_PAYMENT',
}

export enum TransactionStatus {
    New = 'NEW',
    Charged = 'CHARGED',
    Pending = 'PENDING',
    Failed = 'FAILED',
    Success = 'SUCCESS',
    TsqRequired = 'TSQ_REQUIRED',
}

export enum TransactionsErrors {
    CannotProcessTransactions = 'CANNOT_PROCESS_TRANSACTIONS',
    BalanceServiceError = 'ISV_SERVICE_ERROR',
    TsqRequired = 'TSQ_REQUIRED',
}

export enum PaymentIntrumentType {
    Wallet = 'WALLET',
    Card = 'CARD',
}

export enum TransactionStatsTimePeriod {
    Day = 'day',
    Month = 'month',
    Year = 'year',
}

export enum TransactionProcessor {
    Providus = 'providus',
    Interswitch = 'interswitch',
    Flutterwave = 'flutterwave',
    Paystack = 'paystack',
    Provipay = 'provipay',
    Maplerad = 'maplerad',
    Allawee = 'allawee',
    Remita = 'remita',
}

export enum TransactionProcessorType {
    Main = 'main',
    Backup = 'backup',
}

export enum TransactionFeeType {
    PartnerTransfer = 'PARTNER_TRANSFER',
    PlatformTransfer = 'PLATFORM_TRANSFER',
    Vat = 'VAT',
    CardUse = 'PHYSICAL_CARD_USE',
    Shipping = 'CARD_ORDER_SHIPPING',
    FxPurchase = 'FX_PURCHASE',
    PartnerCardCreation = 'PARTNER_CARD_CREATION',
}

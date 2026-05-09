export enum PaymentType {
    PayIn = 'pay-in',
    PayOut = 'pay-out',
    Charge = 'charge',
    Bill = 'bill',
    Local = 'local',
}

export enum PaymentStatus {
    Queued = 'queued',
    New = 'new',
    Pending = 'pending',
    Failed = 'failed',
    Success = 'success',
    Expired = 'expired',
}

export enum PaymentTimelineAction {
    Initiated = 'initiated',
    SentForReversal = 'sent-for-reversal',
    FundsDebited = 'funds-debited',
}

export const PaymentCompletedStatuses = [PaymentStatus.Success, PaymentStatus.Failed];

export enum PaymentErrors {
    InvalidFundingSource = 'invalid-funding-source',
    ExchangeRateHashRequired = 'fx-hash-required',
    FxHashInvalid = 'fx-hash-invalid',
    FxSameCurrency = 'fx-same-currency',
    FxCurrencyMismatch = 'fx-currency-mismatch',
    FundingSourceCurrencyMismatch = 'funding-source-currency-mismatch',
    InsufficientFunds = 'insufficient-funds',
    PaymentFailed = 'payment-failed',
    FundingSourceNotActive = 'funding-source-not-active',
    DuplicatePayment = 'duplicate-payment',
    InvalidBankCode = 'invalid-bank-code',
    BankAccountNotFound = 'bank-account-not-found',
    BillProductNotFound = 'bill-product-not-found',
    CannotRequeuePayment = 'cannot-requeue-payment',
    SameAccountTransfer = 'same-account-transfer',
    CannotReversePayment = 'cannot-reverse-payment',
}

export enum PaymentFailureReason {
    InsufficientFunds = 'insufficient-funds', // direct or system
}

export enum PaymentMethod {
    BankTransfer = 'bank-transfer',
    Transfer = 'transfer',
    FxTransfer = 'fx-transfer',
    FxCharge = 'fx-charge',
    Billing = 'billing',
    LocalTransfer = 'local-transfer',
    Refund = 'refund',
}

export enum PaymentMethodChargeType {
    CardCreation = 'card-creation',
    CardFunding = 'card-funding',
}

export enum EnvoyPaymentAction {
    ProcessPayment = 'process-payment',
}

export enum PaymentTimelineDataCode {
    SystemError = 'system-error',
    InsufficientFunds = 'insufficient-funds',
    WrongExpDate = 'wrong-exp-date',
    BusinessPndRestricted = 'business-pnd-restricted',
}

export enum PaymentType {
    PayIn = 'pay-in',
    PayOut = 'pay-out',
    Charge = 'charge',
}

export enum PaymentStatus {
    New = 'new',
    Pending = 'pending',
    Queued = 'queued',
    Failed = 'failed',
    Success = 'success',
    Expired = 'expired',
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
    PaymentNotInFailedState = 'payment-not-in-failed-state',
    PaymentNotInSuccessState = 'payment-not-in-success-state',
    PaymentNotRefundable = 'payment-not-refundable',
    CannotRequeuePayment = 'cannot-requeue-payment',
    DuplicatePayment = 'duplicate-payment',
    InvalidBankCode = 'invalid-bank-code',
    BankAccountNotFound = 'bank-account-not-found',
    CannotValidatePayment = 'cannot-validate-payment',
    MethodNotSupported = 'method-not-supported',
    CannotForceChargePayment = 'cannot-force-charge-payment',
}

export enum PaymentFailureReason {
    InsufficientFunds = 'insufficient-funds', // direct or system
}

export enum PayoutPaymentMethod {
    BankTransfer = 'bank-transfer',
    Transfer = 'transfer',
    FxTransfer = 'fx-transfer',
    FxCharge = 'fx-charge',
    ForceCharge = 'force-charge',
    Refund = 'refund',
    Billing = 'billing',
    BillingCharge = 'billing-charge',
}

export enum PaymentMethodChargeType {
    CardCreation = 'card-creation',
    CardFunding = 'card-funding',
}

export enum PaymentTimelineDataCode {
    SystemError = 'system-error',
    InsufficientFunds = 'insufficient-funds',
    WrongExpDate = 'wrong-exp-date',
    BusinessPndRestricted = 'business-pnd-restricted',
}

export enum PaymentTimelineAction {
    Initiated = 'initiated',
    SentForReversal = 'sent-for-reversal',
    FundsDebited = 'funds-debited',
}

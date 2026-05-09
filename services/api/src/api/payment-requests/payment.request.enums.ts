export enum PaymentRequestStatus {
    New = 'new',
    Pending = 'pending',
    Cancelled = 'cancelled',
    Completed = 'completed',
}

export enum PaymentRequestMethod {
    BankTransfer = 'bank-transfer',
    PaymentAuthorization = 'payment-authorization',
}

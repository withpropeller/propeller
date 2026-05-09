export enum TransactionMode {
    Debit = 'debit',
    Credit = 'credit',
}

export enum ReconciliationStatus {
    Pending = 'pending',
    Processing = 'processing',
    Completed = 'completed',
    Failed = 'failed',
}

export enum StatementMatchStatus {
    Unmatched = 'unmatched',
    Matched = 'matched',
    Skipped = 'skipped',
}

export enum StatementSourceRef {
    CardAuthorization = 'CardAuthorization',
    Payment = 'Payment',
    ReservePayment = 'ReservePayment',
}

/**
 * High-level classification of a bank statement row's transaction type.
 * Computed from the narration at upload time.
 */
export enum TransactionClass {
    /** POS or ATM card transaction */
    Card = 'card',
    /** NIP/VPS payment with a session ID (inward or outward) */
    Payment = 'payment',
    /** Bank-to-bank transfer without a session ID */
    Transfer = 'transfer',
    /** ISW or card scheme settlement credit */
    Settlement = 'settlement',
    /** Reversal of a prior transaction */
    Reversal = 'reversal',
    /** Bank stamp duty charge */
    StampDuty = 'stamp-duty',
    /** Value Added Tax charge */
    Vat = 'vat',
    /** Transfer commission charge */
    Commission = 'commission',
    /** SMS alert charge */
    SmsCharge = 'sms-charge',
    /** Card scheme / processor fee (bin, routing, personalisation) */
    CardSchemeFee = 'card-scheme-fee',
    /** Account maintenance fee */
    AccountMaintenanceFee = 'account-maintenance-fee',
    /** Miscellaneous bank charge or recovery */
    BankCharge = 'bank-charge',
    /** Legal / reference letter fee */
    LegalFee = 'legal-fee',
    /** Loyalty reward credit */
    LoyaltyReward = 'loyalty-reward',
    /** Could not be classified */
    Unknown = 'unknown',
}

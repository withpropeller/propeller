export type BillingPeriod = `${number}-${number}`;

export enum BillingStatus {
    Paid = 'paid',
    Due = 'due',
    Pending = 'pending',
}

export enum BillableKeys {
    CardIssuing = 'card-issuing',
}

export enum BillableUnits {
    Hours = 'hours',
    Count = 'count',
}

export enum BillingErrors {
    BillingNotDue = 'billing-not-due',
}

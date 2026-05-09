export enum BusinessStatus {
    NOT_APPROVED = 'not-approved',
    REQUESTED = 'requested',
    ON_HOLD = 'on-hold',
    APPROVED = 'approved',
}

export enum BusinessErrors {
    BusinessApprovalUnavailable = 'business-approval-unavailable',
    BusinessNotApproved = 'business-not-approved',
    KycNotCompleted = 'kyc-not-completed',
}

export enum BusinessStatus {
    NOT_APPROVED = 'not-approved',
    REQUESTED = 'requested',
    ON_HOLD = 'on-hold',
    APPROVED = 'approved',
}

export enum KybStatus {
    Draft = 'draft',
    FilesUploading = 'files_uploading',
    Submitted = 'submitted',
    IdentityPending = 'identity_pending',
    UnderReview = 'under_review',
    Approved = 'approved',
    Rejected = 'rejected',
    ManualReview = 'manual_review',
}

export enum BusinessTier {
    Merchant = 'merchant',
    SuperMerchant = 'super_merchant',
}

export enum BusinessErrors {
    BusinessApprovalUnavailable = 'business-approval-unavailable',
    BusinessNotApproved = 'business-not-approved',
}

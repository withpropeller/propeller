export enum CustomerErrors {
    CustomerInactive = 'customer-inactive',
    VerificationLevelInsufficient = 'customer-verification-level-insufficient',
    CustomerConflict = 'customer-reference-conflict',
    VerificationRequired = 'customer-verification-required',
    CustomerNotFound = 'customer-not-found',
    ClaimsRequired = 'customer-claims-required',
    ClaimsIncomplete = 'customer-claims-incomplete',
}

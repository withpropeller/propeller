export enum CardProgramStatus {
    New = 'new',
    ApprovalRequested = 'approval-requested',
    UnderReview = 'under-review',
    ChangesRequested = 'changes-requested',
    Approved = 'approved',
    Manufacturing = 'manufacturing',
    Personalising = 'personalising',
    Testing = 'testing',
    Live = 'live',
    Suspended = 'suspended',
}

export enum CardProgramPartner {
    Interswitch = 'interswitch',
    Providus = 'providus',
}

export enum CardProgramProfileCodes {
    VerveLive = 'verve-live',
    VerveSandbox = 'verve-sandbox',
    PavilionMastercardLive = 'pavilion-mastercard-live',
    PavilionMastercardSandbox = 'pavilion-mastercard-sandbox',
    PavilionVerveLive = 'pavilion-verve-live',
    PavilionVerveSandbox = 'pavilion-verve-sandbox',
}

export const CardProgramProductionInProgressStatuses = [
    CardProgramStatus.Manufacturing,
    CardProgramStatus.Personalising,
    CardProgramStatus.Testing,
];

export const CardProgramApprovedStatuses = [
    CardProgramStatus.Approved,
    CardProgramStatus.Manufacturing,
    CardProgramStatus.Personalising,
    CardProgramStatus.Testing,
    CardProgramStatus.Live,
    CardProgramStatus.Suspended,
];

export const CardProgramGoLiveStatuses = [CardProgramStatus.Live, CardProgramStatus.Suspended];

export const CardProgramDecisionInProgressStatuses = [
    CardProgramStatus.UnderReview,
    CardProgramStatus.ApprovalRequested,
];

export enum CardProgramErrors {
    ApprovalUnavailable = 'approval-unavailable',
    DecisionAlreadyMade = 'decision-already-made',
    DecisionInProgress = 'decision-in-progress',
    ProductionInProgress = 'production-in-progress',
    CardProductionQuantityExceeded = 'card-production-quantity-exceeded',
    CardProgramNotApproved = 'card-program-not-approved',
    CardProgramNotInApprovedState = 'card-program-not-in-approved-state',
    CardProgramNotLive = 'card-program-not-live',
    CardProgramAlreadyWentLive = 'card-program-already-went-live',
    CardPanNotFound = 'card-pan-not-found',
    CardAuthorizationEventRequired = 'card-authorization-events-required',
    CardProgramNotPersonalized = 'card-program-not-personalized',
}

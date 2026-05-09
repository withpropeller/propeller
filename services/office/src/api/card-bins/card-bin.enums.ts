export enum CardBinStatus {
    New = 'new',
    UnderReview = 'under-review',
    Approved = 'approved',
    ApprovalRequested = 'approval-requested',
    Live = 'live',
    Suspended = 'suspended',
}

export enum CardBinLength {
    HundredThousands = '100k',
    OneMillion = '1m',
    TenMillion = '10m',
    HundredMillion = '100m',
    OneBillion = '1b',
}

export enum CardBinBankProvider {
    Providus = 'providus',
}

export enum CardBinProfileCodes {
    VerveLive = 'verve-live',
    VerveSandbox = 'verve-sandbox',
    PavilionMastercardLive = 'pavilion-mastercard-live',
    PavilionVerveLive = 'pavilion-verve-live',
    PavilionVerveSandbox = 'pavilion-verve-sandbox',
    PavilionMastercardSandbox = 'pavilion-mastercard-sandbox',
    MapleradMastercardLive = 'maplerad-mastercard-live',
    MapleradMastercardSandbox = 'maplerad-mastercard-sandbox',
}

export enum CardBinErrors {
    CardBinNotFound = 'card-bin-not-found',
    DecisionAlreadyMade = 'decision-already-made',
    DecisionInProgress = 'decision-in-progress',
    InvalidBinRange = 'invalid-bin-range',
}

export enum CardBinType {
    Dedicated = 'dedicated',
    Shared = 'shared',
}

export const CardBinStatusStatuses = [CardBinStatus.Live, CardBinStatus.Suspended];
export const CardBinApprovedStatuses = [CardBinStatus.Approved, CardBinStatus.Live, CardBinStatus.Suspended];
export const CardBinStatusInProgressStatuses = [CardBinStatus.UnderReview, CardBinStatus.ApprovalRequested];

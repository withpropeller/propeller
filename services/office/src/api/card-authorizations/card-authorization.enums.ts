export enum CardAuthTimelineAction {
    Initiated = 'initiated',
    ErrorOccurred = 'error-occurred',
    SentForProcessing = 'sent-for-processing',
    FundsHeld = 'funds-held',
    FundsCleared = 'funds-cleared',
    FundsDebited = 'funds-debited',
    FundsReversed = 'funds-reversed',
    FundsSelfReversed = 'funds-self-reversed',
}

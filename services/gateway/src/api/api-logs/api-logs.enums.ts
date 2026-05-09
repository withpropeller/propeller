export enum APIRequestStatus {
    Completed = 'completed',
    Pending = 'pending',
    Cancelled = 'cancelled',
}

export enum ApiRequestErrors {
    CannotRetryRequest = 'cannot-retry-request',
    CannotCancelRequest = 'cannot-cancel-request',
}

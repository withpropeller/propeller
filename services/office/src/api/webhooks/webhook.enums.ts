export enum WebhookEventTypes {
    CardCreated = 'card.created',
    CardAuthorizationRequest = 'card.authorization.request',
    CardAuthorizationClosed = 'card.authorization.closed',
    CardAuthorizationUpdate = 'card.authorization.update',
    CardTransactionCreated = 'card.transaction.created',
    PaymentCompleted = 'payment.completed',
    DisputeUpdated = 'dispute.updated',
}

export enum WebhookErrors {
    NoWebhookFound = 'no-webhooks-found',
    WebhookUrlAlreadyExists = 'webhook-url-already-exists',
    WebhookEventsConflict = 'webhook-events-conflict',
}

export const CardAuthorizationWebhookEvents = [
    WebhookEventTypes.CardAuthorizationRequest,
    WebhookEventTypes.CardAuthorizationUpdate,
];

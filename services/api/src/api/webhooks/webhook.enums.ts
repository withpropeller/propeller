export enum WebhookEventTypes {
    PaymentCompleted = 'payment.completed',
    RequestCompleted = 'request.completed',
    RequestCancelled = 'request.cancelled',
}

export enum WebhookErrors {
    NoWebhookFound = 'no-webhooks-found',
    WebhookUrlAlreadyExists = 'webhook-url-already-exists',
    WebhookEventsConflict = 'webhook-events-conflict',
}

// removed CardAuthorizationWebhookEvents — card module deleted (not in MOR plan)

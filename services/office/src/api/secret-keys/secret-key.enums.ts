export enum SecretKeyScopes {
    Cards = 'cards.*',
    CardsCreate = 'cards.create',
    CardsRead = 'cards.read',

    CardPrograms = 'card-programs.*',
    CardProgramsCreate = 'card-programs.create',
    CardProgramsRead = 'card-programs.read',

    CardTransactions = 'card-transactions.*',
    CardTransactionsRead = 'card-transactions.read',

    CardAuthorizations = 'card-authorizations.*',
    CardAuthorizationsRead = 'card-authorizations.read',

    CardDisputes = 'card-disputes.*',
    CardDisputesCreate = 'card-disputes.create',
    CardDisputesRead = 'card-disputes.read',

    Transfers = 'transfers.*',
    TransfersCreate = 'transfers.create',
    TransfersRead = 'transfers.read',

    Customers = 'customers.*',
    CustomersCreate = 'customers.create',
    CustomersRead = 'customers.read',

    Accounts = 'accounts.*',
    AccountsCreate = 'accounts.create',
    AccountsRead = 'accounts.read',

    Webhooks = 'webhooks.*',
    WebhooksCreate = 'webhooks.create',
    WebhooksRead = 'webhooks.read',

    // Payments
    Payments = 'payments.*',
    PaymentRead = 'payments.read',

    // PaymentRequests
    PaymentRequests = 'payment-requests.*',
    PaymentRequestRead = 'payment-requests.read',
    PaymentRequestCreate = 'payment-requests.create',
}

export enum AccessKeyErrors {
    AccessKeyMalfunctioned = 'access-key-malfunctioned',
    BusinessNotApproved = 'BUSINESS_NOT_APPROVED',
}

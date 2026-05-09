export enum SecretKeyScopes {
    Cards = 'cards.*',
    CardsCreate = 'cards.create',
    CardsReadInfo = 'cards.read.info',
    CardsReadSecrets = 'cards.read.secrets',
    CardsReadFundingSource = 'cards.read.funding-source',
    CardsUpdateInfo = 'cards.update.info',
    CardsUpdateLink = 'cards.update.link',
    CardsUpdateFund = 'cards.update.fund',
    CardsUpdateActivate = 'cards.update.activate',
    CardsUpdateStatus = 'cards.update.status',
    CardsUpdateEnroll = 'cards.update.enroll.*',
    CardsUpdateEnrollSafetoken = 'cards.update.enroll.safetoken',
    CardsUpdatePin = 'cards.update.pin',
    CardsDelete = 'cards.delete',

    // Customers
    Customer = 'customers.*',
    CustomerRead = 'customers.read',
    CustomerCreate = 'customers.create',
    CustomerUpdate = 'customers.update',

    // Webhooks
    Webhook = 'webhooks.*',
    WebhookCreate = 'webhooks.create',
    WebhookRead = 'webhooks.read',
    WebhookDelete = 'webhooks.delete',
    WebhookUpdate = 'webhooks.update',

    // Card Programs
    CardProgram = 'card-programs.*',
    CardProgramCreate = 'card-programs.create',
    CardProgramRead = 'card-programs.read',
    CardProgramUpdate = 'card-programs.update',
    CardProgramUpdateStatus = 'card-programs.update.status',
    CardProgramDelete = 'card-programs.delete',

    // Accounts
    Accounts = 'accounts.*',
    AccountsCreate = 'accounts.create',
    AccountsRead = 'accounts.read',
    AccountsReadBalance = 'accounts.read.balance',
    AccountsReadLogs = 'accounts.read.logs',
    AccountsUpdateDepositChannel = 'accounts.update.deposit-channel',

    // Events
    EventRead = 'events.read',
    EventUpdateRetry = 'events.update.retry',

    // Card Authorizations
    CardAuthorizationRead = 'card-authorizations.read',

    // Card Transactions
    CardTransactionRead = 'card-transactions.read',

    // Payments
    Payment = 'payments.*',
    PaymentRead = 'payments.read',
    PaymentRequeue = 'payments.requeue',
    PaymentCreatePayout = 'payments.payout.create',
    PaymentCreateLocal = 'payments.local.create',
    PaymentCreateBill = 'payments.bill.create',
    PaymentBillValidate = 'payments.bill.validate',

    // PaymentRequests
    PaymentRequestRead = 'payment-requests.read',
    PaymentRequestCreate = 'payment-requests.create',

    // Tools
    Tools = 'tools.*',
    ToolsBanks = 'tools.banks.*',
    ToolsBanksRead = 'tools.banks.read',

    // Tools FX
    ToolsFx = 'tools.fx.*',
    ToolsFxRate = 'tools.fx.rate.read',
    ToolsFxQuote = 'tools.fx.quote.read',

    // Fees
    Fees = 'fees.*',
    FeesCreate = 'fees.create',
    FeesRead = 'fees.read',

    // Configurations
    Configurations = 'configurations.*',
    ConfigurationsRead = 'configurations.read',
    ConfigurationsUpdate = 'configurations.update',

    // Disputes
    Dispute = 'disputes.*',
    DisputeRead = 'disputes.read',
    DisputeCreate = 'disputes.create',
    DisputeUpdate = 'disputes.update',

    // Requests
    Requests = 'requests.*',
    RequestsRead = 'requests.read',
}

export enum AccessKeyErrors {
    AccessKeyMalfunctioned = 'access-key-malfunctioned',
    AccessKeyAlreadyTerminated = 'access-key-already-terminated',
}

export enum SecretKeyStatus {
    Active = 'active',
    Terminated = 'terminated',
}

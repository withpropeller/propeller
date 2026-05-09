export enum SecretKeyPermissions {
    Cards = 'cards.*',
    CardsCreate = 'cards.create',
    CardsReadInfo = 'cards.read.info',
    CardsReadSecrets = 'cards.read.secrets',
    CardsReadBalance = 'cards.read.balance',
    CardsReadFundingSource = 'cards.read.funding-source',
    CardsUpdateInfo = 'cards.update.info',
    CardsUpdateLink = 'cards.update.link',
    CardsUpdateFund = 'cards.update.fund',
    CardsUpdateActivate = 'cards.update.activate',
    CardsUpdateReserve = 'cards.update.reserve',
    CardsUpdateStatus = 'cards.update.status',
    CardsUpdateEnroll = 'cards.update.enroll.*',
    CardsUpdateEnrollSafetoken = 'cards.update.enroll.safetoken',
    CardsUpdateEnroll3DS = 'cards.update.enroll.3ds',
    CardsUpdatePin = 'cards.update.pin',
    CardsDelete = 'cards.delete',

    //Requests
    Requests = 'requests.*',
    RequestsRead = 'requests.read',
    RequestsCancel = 'requests.cancel',

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

    // Card Bins
    CardBin = 'card-bins.*',
    CardBinCreate = 'card-bins.create',
    CardBinRead = 'card-bins.read',
    CardBinUpdate = 'card-bins.update',
    CardBinRequestApproval = 'card-bins.request-approval',
    CardBinAccountReadLogs = 'card-bins.account.read.logs',

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

    // PaymentAuthorizations
    PaymentAuthorizationsRead = 'payment-authorizations.read',
    PaymentAuthorizationsCreate = 'payment-authorizations.create',
    PaymentAuthorizationsRevoke = 'payment-authorizations.revoke',

    // Tools
    Tools = 'tools.*',

    // Tools Banks
    ToolsBanks = 'tools.banks.*',
    ToolsBanksRead = 'tools.banks.read',

    // Tools FX
    ToolsFx = 'tools.fx.*',
    ToolsFxRate = 'tools.fx.rate.read',
    ToolsFxQuote = 'tools.fx.quote.read',

    // Tools Categories
    ToolsCategories = 'tools.categories.*',
    ToolsCategoriesRead = 'tools.categories.read',

    // Tools Merchants
    ToolsMerchants = 'tools.merchants.*',
    ToolsMerchantsRead = 'tools.merchants.read',

    // Tools Billing
    ToolsBilling = 'tools.billing.*',
    ToolsBillingRead = 'tools.billing.read',
    ToolsBillingValidate = 'tools.billing.validate',

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

    // Billings
    Billings = 'billings.*',
    BillingsRead = 'billings.read',
}

export enum AccessKeyErrors {
    AccessKeyMalfunctioned = 'ACCESS_KEY_MALFUNCTIONED',
    BusinessNotApproved = 'business-not-approved',
    TrialEnded = 'TRIAL_ENDED',
}

export enum SecretKeyStatus {
    Active = 'active',
    Terminated = 'terminated',
}

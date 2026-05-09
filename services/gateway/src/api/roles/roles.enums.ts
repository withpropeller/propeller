export enum RoleSlugs {
    Owner = 'owner',
    Admin = 'admin',
    Bookkeeper = 'bookkeeper',
    External = 'external',
}

export enum Permissions {
    // Business
    Business = 'business.*',
    BusinessRead = 'business.read.*',
    BusinessReadInfo = 'business.read.info',
    BusinessReadBalance = 'business.read.balance',
    BusinessReadMembers = 'business.read.members',
    BusinessCreateInvite = 'business.create.invite',
    BusinessDeleteInvite = 'business.delete.invite',

    //Approvals
    Approvals = 'approvals.*',
    ApprovalsRead = 'approvals.read',
    ApprovalsList = 'approvals.list.*',
    ApprovalsListSelf = 'approvals.list.self',
    ApprovalsBusinessAccount = 'approvals.request.business-account',
    ApprovalsSpendingLimit = 'approvals.request.spending-limit',

    // Transfer
    Transfer = 'transfer.*',
    TransferInterBank = 'transfer.inter-bank',

    // Accounts
    Accounts = 'accounts.*',
    AccountsCreate = 'accounts.create',
    AccountsRead = 'accounts.read',
    AccountsReadLogs = 'accounts.read.logs',
    AccountsReadBalance = 'accounts.read.balance',
    AccountsUpdateDepositChannel = 'accounts.update.deposit-channel',
    AccountsRequestCreditLimit = 'accounts.request.credit-limit',
    //AuditList
    Audit = 'audit.*',
    AuditList = 'audit.list',

    //Profile
    Profile = 'profile.*',
    ProfileUpdatePassword = 'profile.update.password',

    // Access Key
    SecretKey = 'secret-key.*',
    SecretKeyCreate = 'secret-key.create',
    SecretKeyRead = 'secret-key.read',
    SecretKeyUpdate = 'secret-key.update',
    SecretKeyDelete = 'secret-key.delete',

    // Card Program
    CardProgram = 'card-program.*',
    CardProgramCreate = 'card-program.create',
    CardProgramRead = 'card-program.read',
    CardProgramUpdate = 'card-programs.update',
    CardProgramDelete = 'card-program.delete',

    // Card Bins
    CardBin = 'card-bins.*',
    CardBinCreate = 'card-bins.create',
    CardBinRead = 'card-bins.read',
    CardBinUpdate = 'card-bins.update',
    CardBinRequestApproval = 'card-bins.request-approval',
    CardBinAccountReadLogs = 'card-bins.account.read.logs',

    Webhook = 'webhook-program.*',
    WebhookCreate = 'webhook.create',
    WebhookRead = 'webhook.read',
    WebhookUpdate = 'webhook.update',
    WebhookDelete = 'webhook.delete',

    //ApiLogs
    ApiLogs = 'api-logs.*',
    ApiLogsRead = 'api-logs.read',

    //Customers
    Customers = 'customers.*',
    CustomersCreate = 'customers.create',
    CustomersRead = 'customers.read',
    CustomersUpdate = 'customers.update',
    CustomersDelete = 'customers.delete',

    //Cards
    CardsCreate = 'cards.create',
    CardsRead = 'cards.read.*',
    CardsReadInfo = 'cards.read.info',
    CardsReadDetails = 'cards.read.details',
    CardsReadFundingSource = 'cards.read.funding-source',
    CardsUpdate = 'cards.update.*',
    CardsUpdateInfo = 'cards.update.info',
    CardsUpdateLink = 'cards.update.link',
    CardsUpdateActivate = 'cards.update.activate',
    CardsUpdateStatus = 'cards.update.status',
    CardsUpdateEnroll = 'cards.update.enroll.*',
    CardsUpdateEnrollSafetoken = 'cards.update.enroll.safetoken',
    CardsUpdatePin = 'cards.update.pin',
    CardsDelete = 'cards.delete',

    //Card Authorizations
    CardAuthorization = 'card-authorization.*',
    CardAuthorizationRead = 'card-authorization.read',

    //Card Transactions
    CardTransaction = 'card-transaction.*',
    CardTransactionRead = 'card-transaction.read',

    //Events
    Events = 'events.*',
    EventsRead = 'events.read',
    EventsUpdateRetry = 'events.update.retry',

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

    // Tools Merchants
    ToolsMerchants = 'tools.merchants.*',
    ToolsMerchantsRead = 'tools.merchants.read',

    // Tools FX
    ToolsFx = 'tools.fx.*',
    ToolsFxRate = 'tools.fx.rate.read',
    ToolsFxQuote = 'tools.fx.quote.read',

    // Tools Temp File Upload
    ToolsTempUpload = 'tools.temp.upload',
    ToolsTempDelete = 'tools.temp.delete',

    // Disputes
    Dispute = 'disputes.*',
    DisputeRead = 'disputes.read',
    DisputeCreate = 'disputes.create',
    DisputeUpdate = 'disputes.update',

    // Billings
    Billings = 'billings.*',
    BillingsRead = 'billings.read',
}

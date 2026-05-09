export enum RoleSlugs {
    Owner = 'owner',
    Admin = 'admin',
    Bookkeeper = 'bookkeeper',
    External = 'external',
}

export enum Permissions {
    //Admin
    Admin = 'admin.*',
    AdminInvite = 'admin.invite',
    AdminRead = 'admin.read',
    AdminUpdateRole = 'admin.update.role',

    //Profile
    Profile = 'profile.*',
    ProfileRead = 'profile.read',
    ProfileUpdate = 'profile.update.*',
    ProfileUpdatePassword = 'profile.update.password',

    // Business
    Business = 'business.*',
    BusinessRead = 'business.read.*',
    BusinessReadInfo = 'business.read.info',
    BusinessReadBalance = 'business.read.balance',
    BusinessReadMembers = 'business.read.members',
    BusinessCreateInvite = 'business.create.invite',
    BusinessDeleteInvite = 'business.delete.invite',
    BusinessInitiateSandbox = 'business.initiate.sandbox',

    //Approvals
    Approvals = 'approvals.*',
    ApprovalsRead = 'approvals.read',
    ApprovalsList = 'approvals.list.*',
    ApprovalsListSelf = 'approvals.list.self',
    ApprovalsBusinessAccount = 'approvals.request.business-account',
    ApprovalsCreditLimit = 'approvals.request.credit-limit',
    ApprovalsSpendingLimit = 'approvals.request.spending-limit',
    ApprovalDecisionAccept = 'approvals.decision.accept',
    ApprovalDecisionDecline = 'approvals.decision.decline',
    ApprovalDecisionReverse = 'approvals.decision.reverse',

    // Transfer
    Transfer = 'transfer.*',
    TransferInterBank = 'transfer.inter-bank',

    // Accounts
    Accounts = 'accounts.*',
    AccountsCreate = 'accounts.create',
    AccountsRead = 'accounts.read',
    AccountsReadLogs = 'accounts.read.logs',
    AccountsReadBalance = 'accounts.read.balance',
    AccountsReadBalanceAll = 'accounts.read.balance.all',
    AccountsUpdateDepositChannel = 'accounts.update.deposit-channel',

    // Reserve Accounts
    ReserveAccounts = 'reserve.accounts.*',
    ReserveAccountsCreate = 'reserve.accounts.create',
    ReserveAccountsRead = 'reserve.accounts.read',
    ReserveAccountsReadBalance = 'reserve.accounts.read.balance',
    ReserveAccountsDebit = 'reserve.accounts.debit',
    ReserveAccountsCredit = 'reserve.accounts.credit',
    ReserveSettlementAccountsTransfer = 'reserve.accounts.settlement-account.transfer',

    //AuditList
    Audit = 'audits.*',
    AuditRead = 'audits.read',

    // Access Key
    SecretKey = 'secret-key.*',
    SecretKeyCreate = 'secret-key.create',
    SecretKeyRead = 'secret-key.read',
    SecretKeyUpdate = 'secret-key.update',
    SecretKeyDelete = 'secret-key.delete',

    // Card Program
    CardProgram = 'card-programs.*',
    CardProgramCreate = 'card-programs.create',
    CardProgramRead = 'card-programs.read',
    CardProgramUpdate = 'card-programs.update',
    CardProgramDelete = 'card-programs.delete',
    CardProgramCardUnlink = 'card-programs.card-unlink',
    CardProgramCardRead = 'card-programs.card-read',

    Webhook = 'webhooks.*',
    WebhookCreate = 'webhooks.create',
    WebhookRead = 'webhooks.read',
    WebhookUpdate = 'webhooks.update',
    WebhookDelete = 'webhooks.delete',

    //ApiLogs
    ApiLogs = 'api-logs.*',
    ApiLogsRead = 'api-logs.read',
    ApiLogsRetry = 'api-logs.retry',

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
    CardsUpdate = 'cards.update.*',
    CardsUpdateInfo = 'cards.update.info',
    CardsUpdateLink = 'cards.update.link',
    CardsUpdateActivate = 'cards.update.activate',
    CardsUpdateStatus = 'cards.update.status',
    CardsUpdatePin = 'cards.update.pin',
    CardsDelete = 'cards.delete',

    //Card Bins
    CardBinRead = 'card-bins.read',
    CardBinCreate = 'card-bins.create',

    //Card Authorizations
    CardAuthorization = 'card-authorizations.*',
    CardAuthorizationRead = 'card-authorizations.read',
    CardAuthorizationRefund = 'card-authorizations.refund',
    CardAuthorizationForceReverseLien = 'card-authorizations.force-reverse-lien',
    CardAuthorizationForceDebitLien = 'card-authorizations.force-debit-lien',

    //Card Transactions
    CardTransaction = 'card-transactions.*',
    CardTransactionRead = 'card-transactions.read',

    // Payments
    PaymentRead = 'payments.read',
    PaymentCreatePayout = 'payments.create.payout',
    PaymentCreatePayInRefund = 'payments.create.payin.refund',
    PaymentCreateChargeForce = 'payments.create.charge.force',
    PaymentRequeue = 'payments.requeue',
    PaymentValidate = 'payments.validate',
    PaymentUpdateProcessorData = 'payments.update.processor-data',
    PaymentForceReverseLien = 'payments.force-reverse-lien',

    //Events
    Events = 'events.*',
    EventsRead = 'events.read',
    EventsUpdateRetry = 'events.update.retry',

    // Tools
    Tools = 'tools.*',
    ToolsBanks = 'tools.banks.*',
    ToolsBanksRead = 'tools.banks.read',
    ToolsBanksUpdate = 'tools.banks.update',
    ToolsBanksMapsRead = 'tools.banks.maps.read',
    ToolsBanksMapsUpdate = 'tools.banks.maps.update',

    // Tools FX
    ToolsFx = 'tools.fx.*',
    ToolsFxRate = 'tools.fx.rate.read',
    ToolsFxQuote = 'tools.fx.quote.read',

    ToolsFeesSettings = 'tools.settings.fees.*',
    ToolsFeesSettingsRead = 'tools.settings.fees.read',
    ToolsFeesSettingsUpdate = 'tools.settings.fees.update',
    ToolsFeesSettingsDelete = 'tools.settings.fees.delete',

    ToolsFxSettings = 'tools.settings.fx.*',
    ToolsFxSettingsCreate = 'tools.settings.fx.create',
    ToolsFxSettingsRead = 'tools.settings.fx.read',
    ToolsFxSettingsUpdate = 'tools.settings.fx.update',
    ToolsFxSettingsDelete = 'tools.settings.fx.delete',

    ToolsProvidusRepushSettlement = 'tools.providus.repush-settlement',

    ToolsTransferSettingsRead = 'tools.settings.transfer.read',
    ToolsTransferSettingsUpdate = 'tools.settings.transfer.update',

    // Settlement Accounts
    SettlementAccounts = 'settlement-accounts.*',
    SettlementAccountsRead = 'settlement-accounts.read',
    SettlementAccountsReadLogs = 'settlement-accounts.read.logs',
    SettlementAccountsReadBalance = 'settlement-accounts.read.balance',
    SettlementAccountsTransfer = 'settlement-accounts.transfer',
    // Disputes
    Dispute = 'disputes.*',
    DisputeRead = 'disputes.read',
    DisputeUpdate = 'disputes.update',
    DisputeRefund = 'disputes.refund',

    // Users
    Users = 'users.*',
    UsersRead = 'users.read',

    // Transactions Settings
    ToolsTransactionSettingsRead = 'tools.transaction.settings.read',
    ToolsTransactionSettingsUpdate = 'tools.transaction.settings.update',
    ToolsTransactionSettingsDelete = 'tools.transaction.settings.delete',

    // Transactions Settings
    ToolsMerchantsCreate = 'tools.merchants.create',
    ToolsMerchantsRead = 'tools.merchants.read',
    ToolsMerchantsUpdate = 'tools.merchants.update',
    ToolsMerchantsDelete = 'tools.merchants.delete',

    // Transactions Settings
    ToolsBillingCreate = 'tools.billing.create',
    ToolsBillingRead = 'tools.billing.read',
    ToolsBillingUpdate = 'tools.billing.update',
    ToolsBillingDelete = 'tools.billing.delete',

    // Billings
    Billings = 'billings.*',
    BillingsRead = 'billings.read',
    BillingsCharge = 'billings.charge',

    // Reconciliation
    Reconciliation = 'reconciliation.*',
    ReconciliationRead = 'reconciliation.read',
    ReconciliationUpload = 'reconciliation.upload',
    ReconciliationRun = 'reconciliation.run',
}

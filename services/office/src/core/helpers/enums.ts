export enum QueueTasks {
    SEND_NOTIFICATION = 'infra.task.notifications',
    SEND_EVENT = 'infra.events',
}

export enum NotificationTemplates {
    Welcome = 'developer-welcome',
    SignInAccount = 'signin-account',
    ConfirmAccount = 'confirm-account',
    ConfirmPhone = 'confirm-phone',
    ResetPassword = 'reset-password',
    TeamInvite = 'admin.user.invite',
    AccountActivated = 'admin.user.activated',
    TransactionNotification = 'transaction-notification',
    TwoFactorRequested = 'two-factor-requested',
    KycPomptEmail = 'user-kyc-prompt',
    PaymentInstrumentTopup = 'payment-instrument-top-up',
    CardOrderReceived = 'card-order-received',
    BusinessApprovalDeclined = 'business-account-approval-declined',
    BusinessApprovalAccepted = 'business-account-approval-accepted',
}

export enum RequestTasks {
    GENERATE_REPORT = 'request.generate.report',
    GENERATE_PDF_REPORT = 'request.generate.pdf.report',
}

export enum AccountStatus {
    PENDING = 'pending',
    REQUIRES_ACTIVATION = 'requires-activation',
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    TERMINATED = 'terminated',
}

export enum WorkerQueue {
    JOB_SERVICE = 'allawee.job.services',
    CREDIT_DATA_SERVICE = 'allawee.credit.data.services',
}

export enum AppStatus {
    Success = 'success',
    Unauthorized = 'unauthorized',
    Forbidden = 'forbidden',
    BadRequest = 'bad-request',
    NotFound = 'not-found',
    ReferenceConflict = 'reference-conflict',
    Conflict = 'conflict',
    WorkerError = 'worker-error',
    ConfigurationError = '  configuration-error',
    ApplicationTimeout = 'application-timeout',
    ApplicationError = 'application-error',
    RequestTimeout = 'request-timeout',
    ServiceUnavailable = 'service-unavailable',
    TooManyRequests = 'too-many-requests',

    TopshipError = 'topship-error',
    OperationNotAllowed = 'operation-not-allowed',
    ConflictError = 'conflict-error',
    IntegrationError = 'integration-error',
    IdentityPassError = 'identity-pass-error',
    ApprovalIsPending = 'approval-is-pending',
    ProvidusThirdPartyError = 'providus-third-party-error',
}

export enum MessagingChannel {
    WHATSAPP = 'whatsapp',
    SMS = 'sms',
}

export enum TenantDataSource {
    Core = 'core',
    Live = 'live',
    Sandbox = 'sandbox',
    Office = 'office',
}

export enum ApiVersion {
    Current = '2023-02-01',
    v2023_02_01 = '2023-02-01',
}

export enum Events {
    BusinessCreated = 'business.created',
}

export enum ApiVersions {
    Current = '2023-02-01',
    v2023_01_01 = '2023-02-01',
}
export enum ModelIdTag {
    Business = 'bz',
    Customer = 'cus',
    Webhook = 'wh',
    Balance = 'bal',
    Account = 'ac',
    IsvAccount = 'isv.ac',
    AccountLog = 'ac.log',
    ReserveAccount = 'ac.rsv',
    CardProgram = 'c.prg',
    Card = 'c',
    CardTransaction = 'c.txn',
    CardAuthorization = 'c.auth',
    Dispute = 'd',
    Payment = 'p',
    ReservePayment = 'p.rsv',
    Event = 'evt',
    EventAttempt = 'evt.a',
    Request = 'req',
    Log = 'log',
    SettlementAccountLog = 'sac.log',
    SettlementAccount = 'sac',
    Merchant = 'mch',
    Approval = 'apr',
    Admin = 'adm',
    User = 'usr',
    Configuration = 'cfg',
    Fee = 'fee',
    OnboardSurvey = 'os',
    BillProduct = 'bp',
    Billing = 'bil',
    AccountStatement = 'ac.stmt',
    ReconciliationRun = 'rec',
}

export enum ModelRef {
    User = 'User',
    Customer = 'Customer',
    Webhook = 'Webhook',
    Account = 'Account',
    CardProgram = 'CardProgram',
    Card = 'Card',
    CardTransaction = 'CardTransaction',
    CardAuthorization = 'CardAuthorization',
    Dispute = 'Dispute',
    Payment = 'Payment',
    Event = 'Event',
    EventAttempt = 'EventAttempt',
    Request = 'Request',
    Merchant = 'Merchant',
    Fee = 'Fee',
    Configuration = 'Configuration',
}

export enum AccessKeyTag {
    RecoveryKey = 'rk',
    LiveKey = 'sk.live',
    TestKey = 'sk.test',
    WebhookSigningKey = 'wsk',
}

export enum ObjectType {
    AccountBalance = 'account.balance',
    SettlementAccountBalance = 'settlement.account.balance',
    CardSecrets = 'card.secrets',
    CardAuthorization = 'card.authorization',
    Payment = 'payment',
    Balance = 'balance',
}

export enum LocalRequestProperty {
    DashboardMode = 'x-dashboard-mode',
    DryRun = 'x-dry-run',
}

export enum RedisKeys {
    Views = 'infra:views',
    Assemble = 'infra:assemble',
    Envoy = 'infra:envoy',
    EnvoyStream = 'envoy:stream',
    TransferSettings = 'settings:transfer',
    MainTransferSettings = 'settings:transfer:main',
    BackupTransferSettings = 'settings:transfer:backup',
    BankSettings = 'settings:banks:standard',
    BankMappingsSettings = 'settings:banks:mappings',
    FeesSettings = 'infra:settings:fees',
    FxRateSettings = 'settings:currency-exchange-rates',
    CategorySettings = 'settings:transactions:categories',
    MerchantSettings = 'settings:merchants',
    SettingsMerchantUnclassified = 'settings:merchants:unclassified',
    MerchantSettingsIdxKey = 'idx:settings:merchants',
}

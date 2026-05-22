export enum QueueTasks {
    SEND_NOTIFICATION = 'infra.task.notifications',
    SEND_EVENT = 'infra.events',
}

export enum NotificationTemplates {
    ConfirmAccount = 'confirm.account',
    ResetPassword = 'reset.password',
    TeamInvite = 'team.invite',
    AccountActivated = 'account.activated',
    BusinessApprovalRequested = 'business.approval.requested',
    ApprovalRequestEvent = 'business.approval.requested.admin',
    TwoFactorRequested = 'two-factor.requested',
    KycPromptEmail = 'user.kyc.prompt',
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
    ProvidusThirdPartyError = 'providus-third-party-error',
    RequestAccepted = 'request-accepted',
}

export enum MessagingChannel {
    WHATSAPP = 'whatsapp',
    SMS = 'sms',
}

export enum TenantDataSource {
    Core = 'core',
    Live = 'live',
    Sandbox = 'sandbox',
}

export enum Events {
    BusinessCreated = 'business.created',
}

export enum ApiVersions {
    Current = '2024-05-01',
    v2023_02_01 = '2023-02-01',
    v2024_05_01 = '2024-05-01',
}

export enum ModelIdTag {
    User = 'usr',
    Business = 'bz',
    Customer = 'cus',
    Webhook = 'wh',
    Account = 'ac',
    CardProgram = 'c.prg',
    Card = 'c',
    CardTransaction = 'c.txn',
    CardAuthorization = 'c.auth',
    Dispute = 'd',
    Payment = 'p',
    Event = 'evt',
    EventAttempt = 'evt.a',
    Request = 'req',
    Log = 'log',
    Merchant = 'mch',
    Fee = 'fee',
    Configuration = 'cfg',
}

export enum AccessKeyTag {
    RecoveryKey = 'rk',
    LiveKey = 'sk.live',
    TestKey = 'sk.test',
    WebhookSigningKey = 'wsk',
}

/** Flo KV key prefixes (see https://docs.floruntime.io/primitives/kv/). */
export enum FloKeys {
    AuthEmail = 'auth:email',
}

export enum RedisKeys {
    Views = 'infra:views',
    Assemble = 'infra:assemble',
    Envoy = 'infra:envoy',
    EnvoyStream = 'envoy:stream',
    TransferSettings = 'settings:transfer',
    BankSettings = 'settings:banks',
    FeesSettings = 'infra:settings:fees',
    FxRateSettings = 'settings:currency-exchange-rates',
}

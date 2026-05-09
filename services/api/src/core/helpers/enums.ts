export enum AppStatus {
    Success = 'success',
    Unauthorized = 'unauthorized',
    Forbidden = 'forbidden',
    BadRequest = 'bad-request',
    NotFound = 'not-found',
    ReferenceConflict = 'reference-conflict',
    Conflict = 'conflict',
    WorkerError = 'WORKER_ERROR',
    ConfigurationError = 'CONFIGURATION_ERROR',
    ApplicationTimeout = 'application-timeout',
    ApplicationError = 'application-error',
    RequestTimeout = 'REQUEST_TIMEOUT',
    ServiceUnavailable = 'service-unavailable',
    TooManyRequests = 'too-many-requests',
    RequestAccepted = 'request-accepted',
}

export enum TenantDataSource {
    Core = 'core',
    Live = 'live',
    Sandbox = 'sandbox',
}

export enum ApiVersion {
    Current = '2024-05-01',
    v2023_02_01 = '2023-02-01',
    v2024_05_01 = '2024-05-01',
}

export enum LocalRequestProperty {
    User = 'alw-user',
    AccessKey = 'alw-access-key',
    TenantId = 'alw-tenant-id',
    BusinessId = 'alw-business-id',
    UserId = 'alw-user-id',
    ForwardedIp = 'alw-forwarded-ip',
    ForwardedUserAgent = 'alw-forwarded-user-agent',
    ApiVersion = 'allawee-version',
    RequestId = 'x-request-id',
    ApiMode = 'x-api-mode',
    DryRun = 'x-dry-run',
    GRPForceRetry = 'x-grp-force-retry',
    GRPForceHardStop = 'x-grp-force-hard-stop',
    EncryptedBy = 'x-encrypted-by',
}

export enum RedisKeys {
    Views = 'views',
    Assemble = 'infra:assemble',
    EnvoyStream = 'envoy:stream',
    CategorySettings = 'settings:transactions:categories',
    MainTransferSettings = 'settings:transfer:main',
    BackupTransferSettings = 'settings:transfer:backup',
    BankSettings = 'settings:banks:standard',
    BankMappingsSettings = 'settings:banks:mappings',
    FeesSettings = 'infra:settings:fees',
    FxRateSettings = 'settings:currency-exchange-rates',
    MerchantSettings = 'settings:merchants',
    MerchantSettingsIdxKey = 'idx:settings:merchants',
}

export enum ObjectType {
    AccountBalance = 'account.balance',
    CardSecrets = 'card.secrets',
    CardAuthorization = 'card.authorization',
    Payment = 'payment',
}

export enum ModelRef {
    User = 'User',
    Customer = 'Customer',
    Webhook = 'Webhook',
    Account = 'Account',
    CardProgram = 'CardProgram',
    Card = 'Card',
    CardBin = 'CardBin',
    CardTransaction = 'CardTransaction',
    CardAuthorization = 'CardAuthorization',
    Dispute = 'Dispute',
    Payment = 'Payment',
    Event = 'Event',
    EventAttempt = 'EventAttempt',
    Request = 'ApiRequest',
    Merchant = 'Merchant',
    Fee = 'Fee',
    Configuration = 'Configuration',
}

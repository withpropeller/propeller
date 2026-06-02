export enum AccountCurrency {
    NGN = 'NGN',
    USD = 'USD',
}

export enum AccountType {
    Main = 'main',
    Sub = 'sub',
    Virtual = 'virtual',
}

export enum VirtualAccountPartner {
    AllaweeSandbox = 'allawee-sandbox',
    Providus = 'providus',
}

export enum DepositChannelType {
    BankAccount = 'bank-account',
}

export enum AccountErrors {
    CustomerRequired = 'customer-required',
    NotFound = 'account-not-found',
    NotActive = 'account-not-active',
    InvalidAccountType = 'invalid-account-type',
    InvalidAccountCurrency = 'invalid-account-currency',
    DepositCurrencyNotSupported = 'deposit-currency-not-supported',
    DepositChannelAlreadyExists = 'deposit-channel-already-exists',
    DepositChannelNotFound = 'deposit-channel-not-found',
}

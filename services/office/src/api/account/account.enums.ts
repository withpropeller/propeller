export enum AccountCurrency {
    NGN = 'NGN',
}

export enum AccountType {
    Main = 'main',
    Sub = 'sub',
    Virtual = 'virtual',
}

export enum AccountStatus {
    Active = 'active',
    PND = 'post-no-debit',
}

export enum VirtualAccountPartner {
    AllaweeSandbox = 'allawee-sandbox',
    Providus = 'providus',
}

export enum DepositChannelType {
    BankAccount = 'bank-account',
}

export enum AccountErrors {
    DepositChannelNotFound = 'deposit-channel-not-found',
}

export const DepositaryCurrencies = [AccountCurrency.NGN];

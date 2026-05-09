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

export enum AccountStatus {
    Active = 'active',
    PND = 'post-no-debit',
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

export enum DepositChannelType {
    BankAccount = 'bank-account',
}

export const DepositaryCurrencies = [AccountCurrency.NGN];

export enum ReserveAccountSlug {
    ProvidusVostro = 'vostro',
    USDMapleradVostro = 'usd-maplerad-vostro',
    MapleradVostro = 'maplerad-ngn-vostro',
    VirtualCardFunding = 'flutterwave-virtual-card-funding',
    NGNFxReserve = 'ngn-fx-reserve',
}

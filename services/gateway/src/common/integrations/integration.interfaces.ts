import { PaymentResourceStatus } from '@common/payment-resources';
import { User } from '@api/users';
import { HydratedDocument } from 'mongoose';


export interface ResponseData<T = any> {
    code: string;
    error: string;
    data?: T;
}

export interface VerifyWebhook {
    verify(request: any, config: any): boolean;
}

export interface IBVNIntegration {
    resolveBvn(bvn: string): Promise<BVNData>;
}

export interface IBankResolveIntegration {
    getBankList(): Promise<CommercialBank[]>;
    resolveBankAccount(accountNumber: string, bankCode: string): Promise<ResolvedAccount>;
}

// IVirtualCardIntegration removed — card-issuing not in MOR plan
export interface IVirtualCardIntegration {}

export interface IShippingIntegration {
    getQuote(address: any, deliveryType: ShippingPriceTier): Promise<ShippingQuoteData>;
    getQuotes(address: any): Promise<ShippingQuoteData[]>;
    getCountries(): Promise<ShippingCountryData[]>;
    getStates(countryCode: string): Promise<ShippingStateData[]>;
    getCities(countryCode: string): Promise<ShippingCityData[]>;
}

export interface CreateVirtualCardData {
    type;
    currency: 'USD' | 'NGN';
    amount: number;
    debit_currency: 'USD' | 'NGN';
    billing_name: string;
    /* billing_address: string,
    billing_city: string,
    billing_state: string,
    billing_postal_code: string,
    billing_country: string, */
}

export enum ShippingPriceTier {
    Standard = 'standard',
    Express = 'express',
}

export interface ShippingQuoteData {
    price: number;
    pricingTier: ShippingPriceTier;
    etaText: string;
    currency: string;
}

export interface ShippingCityData {
    cityName: string;
    suburbName: string;
    postcode: string;
}

export interface ShippingStateData {
    slug: string;
    pk: string;
    countryCode: string;
    name: string;
    code: string;
}

export interface ShippingCountryData {
    code: string;
    name: string;
}

export class BankData {
    name: string;
    code: string;
    providusCode: string;
    abbr: string;
    imageUrl: string;
    rank: number;
}

export interface BankAccountBalance {
    availableBalance: number;
    lockedBalance: number;
}

export interface BVNData {
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfBirth: string;
    phoneNumber: string;
    bvn: string;
}

// CardData / CardDataSecrets removed — card-issuing not in MOR plan

export interface CommercialBank {
    code: string;
    name: string;
    abbr: string;
    rank: number;
    imageUrl: string;
}

export interface ResolvedAccount {
    name: string;
    bvn?: string;
    kyc?: string;
    nipSessionId?: string;
}



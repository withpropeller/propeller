import { CardDetails } from './cards.schema';

export interface Identity {
    name: string;
    phone: string;
    gender: string;
    dateOfBirth: string;
    email: string;
    address: string;
    customerId: string;
}

export interface CardGeneratedData {
    cardDetails: CardDetails[];
    cardCsv: string;
    accountCsv: string;
    cardAccountCsv: string;
}

export interface CardGeneratedAuthData {
    authData: string;
}

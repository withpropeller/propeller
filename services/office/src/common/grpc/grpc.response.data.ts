export interface GrpcResponseData<T = any> {
    code: string;
    error: string;
    data?: T;
}

export interface GrpcPlainCardResponse {
    accountNumber: string;
    accountName: string;
    pan: string;
    currency: string;
    pin: string;
    expiryDate: string;
    availableBalance: number;
    id: string;
    lockedBalance: number;
    accountId: string;
    cvv: string;
}

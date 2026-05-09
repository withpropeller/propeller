export interface InitializedTransferData {
    status: string;
    transferCode: string;
    reference: string;
    rawData: any;
}

export interface InitializedPaymentData {
    reference: string;
    authorizationUrl: string;
    rawData: any;
}

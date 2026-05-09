export interface CardAuthorizationCSVEntry {
    id: string;
    status: string;
    channel: string;
    network: string;
    amount: number;
    fees: number;
    amountMoney: string;
    feesMoney: string;
    type: string;
    currency: string;
    merchantDescriptor: string;
    merchantId: string;
    stan: string;
    rrn: string;
    cardId: string;
    cardLast4: string;
    txTime: string;
}

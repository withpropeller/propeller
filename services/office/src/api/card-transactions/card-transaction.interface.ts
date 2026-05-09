export interface CardTransactionCSVEntry {
    id: string;
    channel: string;
    network: string;
    amount: number;
    amountMoney: string;
    fees: number;
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

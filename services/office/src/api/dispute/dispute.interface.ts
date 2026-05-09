export interface DisputeCSVEntry {
    id: string;
    type: string;
    status: string;
    statusReason: string;
    rrn: string;
    stan: string;
    terminalId: string;
    maskedPan: string;
    cardExpiry: string;
    narration: string;
    channel: string;
    sessionId: string;
    amount: number;
    amountMoney: string;
    currency: string;
    createdAt: string;
    txTime: string;
}

export interface BillingCSVEntry {
    id: string;
    status: string;
    currency: string;
    businessName: string;
    businessEmail: string;
    invoiceNo: string;
    period: string;
    dueDate?: string;
    billedAmount: number;
    billedAmountMoney: string;
    invoicePdf?: string;
}

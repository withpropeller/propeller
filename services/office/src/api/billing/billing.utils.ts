import { Utils } from '@core/helpers';
import { BillingCSVEntry } from './billing.interface';
import { format } from 'date-fns';

export function buildBillingCVData(doc: any): BillingCSVEntry {
    return {
        id: doc.id,
        status: doc.status,
        currency: doc.currency,
        businessName: doc.business.name,
        businessEmail: doc.business.email,
        invoiceNo: doc.invoiceNo,
        period: doc.period,
        dueDate: doc.dueDate ? format(doc.dueDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : '',
        billedAmount: doc.billedAmount ? doc.billedAmount / 100 : 0,
        billedAmountMoney: doc.billedAmount ? Utils.parseInt64ToCurrency(doc.billedAmount, doc.currency) : '',
        invoicePdf: doc.invoicePdf?.url,
    };
}

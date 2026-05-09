import { Customer } from './consumer';
import { BureauCreditReport } from './credit-bureau.interface';

export interface Report {
    publicId: string;
    metadata: {
        cached: boolean;
    };
    customer: Customer;
    lastGenerated: Date;
    bureaus: BureauCreditReport[];
}

import { CustomerVerificationType } from './customer.schema';

export interface CustomerValidationOptions {
    validTiers: CustomerVerificationType[];
    validateLegalAge?: boolean;
}

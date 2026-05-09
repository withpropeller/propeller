import { Customer } from '@api/customer/customer.schema';
import { FxQuote } from '@common/integrations/integrations.interfaces';
import { Business } from '@models/business/business.schema';
import { HydratedDocument } from 'mongoose';
import { PaymentMethodChargeType } from './payment.enums';
import { IFundingSource } from './payment.schema';

export interface CreateFxChargeDto {
    business: HydratedDocument<Business>;
    customer: HydratedDocument<Customer>;
    debitSource: IFundingSource;
    fxQuote: FxQuote;
    chargeType: PaymentMethodChargeType;
    chargeFor?: string;
    chargeForRef?: string;
    reference?: string;
    metadata?: Record<string, any>;
}

export interface IEnvoyPaymentResponse {
    status: string;
}

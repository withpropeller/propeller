import { ParamValidationPipe } from '@core/pipes/param-validation.pipe';
import {
    CreatePaymentRequestBankTransferDto,
    CreatePaymentRequestPaymentAuthorizationDto,
    ICreatePaymentRequestDto,
} from './payment-request.dto';
import { PaymentRequestMethod } from './payment.request.enums';

export async function validateCreatePaymentRequest(value: ICreatePaymentRequestDto) {
    if (value?.method == PaymentRequestMethod.PaymentAuthorization) {
        return ParamValidationPipe.ensureParams(CreatePaymentRequestPaymentAuthorizationDto, value);
    }
    return ParamValidationPipe.ensureParams(CreatePaymentRequestBankTransferDto, value);
}

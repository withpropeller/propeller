import { CustomException } from '@core/exceptions';
import { HttpStatus } from '@nestjs/common';
import { PaymentErrors } from './payment.enums';

export class PaymentException extends CustomException {
    constructor(
        err: any,
        code: string,
        status: number = HttpStatus.UNPROCESSABLE_ENTITY,
        message = 'Payment Exception',
        body?: any,
    ) {
        super(err, code, status, message, body);
    }

    public static get InvalidFundingSource() {
        return new this('Invalid funding source', PaymentErrors.InvalidFundingSource);
    }

    static get FxHashInvalid() {
        return new this('Invalid or expired FX Hash', PaymentErrors.FxHashInvalid);
    }

    static get FxSameCurrency() {
        return new this('FX currency and funding source cannot be same currency', PaymentErrors.FxSameCurrency);
    }

    static get FxCurrencyMismatch() {
        return new this('FX currency and funding source currency mismatch', PaymentErrors.FxCurrencyMismatch);
    }

    static get FundingSourceCurrencyMismatch() {
        return new this(
            'Funding Source currency and funding source currency mismatch',
            PaymentErrors.FundingSourceCurrencyMismatch,
        );
    }

    static get FundingSourceNotActive() {
        return new this('Funding Source not active', PaymentErrors.FundingSourceNotActive);
    }

    static get InsufficientFunds() {
        return new this('Insufficient funds', PaymentErrors.InsufficientFunds);
    }

    static get PaymentFailed() {
        return new this('Payment failed', PaymentErrors.PaymentFailed);
    }

    static get DuplicatePayment() {
        return new this('Duplicate payment, retry in 5 minutes', PaymentErrors.DuplicatePayment);
    }

    static get InvalidBankCode() {
        return new this('Invalid bank code', PaymentErrors.InvalidBankCode);
    }

    static get BankAccountNotFound() {
        return new this('Unable to resolve bank account', PaymentErrors.BankAccountNotFound);
    }

    static get BillProductNotFound() {
        return new this('Bill product not found', PaymentErrors.BillProductNotFound);
    }

    static get CannotRequeuePayment() {
        return new this('Payment not in queueable state', PaymentErrors.CannotRequeuePayment);
    }

    static get SameAccountTransfer() {
        return new this('Cannot transfer to the same account', PaymentErrors.SameAccountTransfer);
    }

    static get CannotReversePayment() {
        return new this('Payment cannot be reversed', PaymentErrors.CannotReversePayment);
    }
}

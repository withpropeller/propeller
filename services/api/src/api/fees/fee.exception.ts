import { CustomException } from '@core/exceptions';
import { HttpStatus } from '@nestjs/common';
import { FeeErrors } from './fee.enums';

export class FeeException extends CustomException {
    constructor(
        err: any,
        code: string,
        status: number = HttpStatus.UNPROCESSABLE_ENTITY,
        message = 'Fee Exception',
        body?: any,
    ) {
        super(err, code, status, message, body);
    }

    public static get InvalidAccountType() {
        return new this('Invalid account type, main account required', FeeErrors.InvalidAccountType);
    }

    public static get NotActive() {
        return new this('Fee is not active', FeeErrors.NotActive);
    }

    public static get InvalidCurrency() {
        return new this('Invalid currency', FeeErrors.InvalidCurrency);
    }
}

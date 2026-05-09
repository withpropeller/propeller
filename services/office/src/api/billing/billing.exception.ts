import { CustomException } from '@core/exceptions';
import { HttpStatus } from '@nestjs/common';
import { BillingErrors } from './billing.enums';

export class BillingException extends CustomException {
    constructor(
        err: any,
        code: string,
        status: number = HttpStatus.UNPROCESSABLE_ENTITY,
        message = 'Billing Exception',
        body?: any,
    ) {
        super(err, code, status, message, body);
    }

    public static get BillingNotDue() {
        return new this('Billing is not due', BillingErrors.BillingNotDue, HttpStatus.BAD_REQUEST);
    }
}

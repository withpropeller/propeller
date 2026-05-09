import { CustomException } from '@core/exceptions';
import { HttpStatus } from '@nestjs/common';
import { CustomerErrors } from './customer.enums';

export class CustomerException extends CustomException {
    constructor(
        err: any,
        code: string,
        status: number = HttpStatus.UNPROCESSABLE_ENTITY,
        message = 'Customer Exception',
        body?: any,
    ) {
        super(err, code, status, message, body);
    }

    public static get CustomerNotActive() {
        return new this('Customer Inactive', CustomerErrors.CustomerInactive);
    }

    public static get CustomerNotFound() {
        return new this('Customer not found', CustomerErrors.CustomerNotFound, HttpStatus.NOT_FOUND);
    }

    public static get ClaimsRequired() {
        return new this('Customer claims required', CustomerErrors.ClaimsRequired, HttpStatus.BAD_REQUEST);
    }

    public static get ClaimsIncomplete() {
        return new this('Customer claims incomplete', CustomerErrors.ClaimsIncomplete, HttpStatus.BAD_REQUEST);
    }

    public static get VerificationLevelInsufficient() {
        return new this(
            'Customer verification level not sufficient',
            CustomerErrors.VerificationLevelInsufficient,
            HttpStatus.BAD_REQUEST,
        );
    }

    public static get VerificationRequired() {
        return new this('Customer verification required', CustomerErrors.VerificationRequired, HttpStatus.BAD_REQUEST);
    }
}

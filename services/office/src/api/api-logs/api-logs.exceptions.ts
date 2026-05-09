import { CustomException } from '@core/exceptions';
import { HttpStatus } from '@nestjs/common';
import { ApiRequestErrors } from './api-log.enums';

export class ApiRequestException extends CustomException {
    constructor(
        err: any,
        code: string,
        status: number = HttpStatus.UNPROCESSABLE_ENTITY,
        message = 'Business Exception',
        body?: any,
    ) {
        super(err, code, status, message, body);
    }

    public static get CannotRetryRequest() {
        return new this('Cannot Retry Request', ApiRequestErrors.CannotRetryRequest);
    }
}

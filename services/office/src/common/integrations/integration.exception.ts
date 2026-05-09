import { CustomException } from '@core/exceptions';
import { HttpStatus } from '@nestjs/common';
import { IntegrationErrors } from './integration.enums';

export class IntegrationException extends CustomException {
    constructor(
        err: any,
        code: string,
        status: number = HttpStatus.UNPROCESSABLE_ENTITY,
        message = 'Integration Exception',
        body?: any,
    ) {
        super(err, code, status, message, body);
    }

    static PavilionError(err: any, body?: any) {
        return new IntegrationException(
            err,
            IntegrationErrors.PavilionError,
            HttpStatus.INTERNAL_SERVER_ERROR,
            'Pavilion Integration Error',
            body,
        );
    }
}

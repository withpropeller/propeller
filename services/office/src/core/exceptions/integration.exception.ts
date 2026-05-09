import { HttpStatus } from '@nestjs/common';
import { CustomException } from './custom-exception';

export class IntegrationException extends CustomException {
    constructor(
        err: any,
        code: string,
        message = 'External Integration Exception',
        status: number = HttpStatus.INTERNAL_SERVER_ERROR,
    ) {
        super(err, code, status, message);
    }
}

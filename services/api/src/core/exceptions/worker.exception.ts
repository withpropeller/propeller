import { HttpStatus } from '@nestjs/common';
import { CustomException } from './custom-exception';
import { AppStatus } from '@core/helpers';

export class WorkerException extends CustomException {
    constructor(
        err: any,
        code = AppStatus.WorkerError,
        status: number = HttpStatus.INTERNAL_SERVER_ERROR,
        message = 'Worker Exception',
    ) {
        super(err, code as string, status, message);
    }
}

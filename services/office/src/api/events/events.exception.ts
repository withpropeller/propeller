import { CustomException } from '@core/exceptions';
import { HttpStatus } from '@nestjs/common';
import { EventErrors } from './event.enums';

export class EventException extends CustomException {
    constructor(
        err: any,
        code: string,
        status: number = HttpStatus.UNPROCESSABLE_ENTITY,
        message = 'Event Exception',
        body?: any,
    ) {
        super(err, code, status, message, body);
    }

    public static get CannotResendSyncEvents() {
        return new this('Cannot Resent Sync Events', EventErrors.CannotResendSyncEvents);
    }
}

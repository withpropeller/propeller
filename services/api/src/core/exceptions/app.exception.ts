import { AppStatus } from '@core/helpers';
import { HttpStatus } from '@nestjs/common';
import { CustomException } from './custom-exception';

export class AppException extends CustomException {
    constructor(err: any, message = 'App Exception', code?: string, status: number = HttpStatus.SERVICE_UNAVAILABLE) {
        super(err, code, status, message);
    }

    public static get ForbiddenRequest() {
        return new this(null, 'forbidden requests', AppStatus.Forbidden, HttpStatus.FORBIDDEN);
    }

    public static get BadRequest() {
        return new this(null, 'Bad Request', AppStatus.BadRequest, HttpStatus.BAD_REQUEST);
    }

    public static get REQUEST_TIMEOUT() {
        return new this(null, 'Request Timed out', AppStatus.RequestTimeout, HttpStatus.REQUEST_TIMEOUT);
    }

    public static get RESOURCE_UNAVAILABLE() {
        return new this(null, 'Service Unavailable', AppStatus.ServiceUnavailable, HttpStatus.SERVICE_UNAVAILABLE);
    }

    public static get ServiceUnavailable() {
        return new this(null, 'Service Unavailable', AppStatus.ServiceUnavailable, HttpStatus.SERVICE_UNAVAILABLE);
    }

    public static get NotFound() {
        return new this(null, 'Not Found', AppStatus.NotFound, HttpStatus.NOT_FOUND);
    }

    public static get ReferenceConflict() {
        return new this(null, 'Reference Conflict', AppStatus.ReferenceConflict, HttpStatus.CONFLICT);
    }

    public static get Conflict() {
        return new this(null, 'Conflict', AppStatus.Conflict, HttpStatus.CONFLICT);
    }
}

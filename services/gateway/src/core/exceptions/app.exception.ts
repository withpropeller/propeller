import { AppStatus } from '@core/helpers';
import { HttpStatus } from '@nestjs/common';
import { CustomException } from './custom-exception';

export class AppException extends CustomException {
    constructor(err: any, message = 'App Exception', code?: string, status: number = HttpStatus.SERVICE_UNAVAILABLE) {
        super(err, code, status, message);
    }

    public static get REQUEST_TIMEOUT() {
        return new this(null, 'Request Timed out', AppStatus.RequestTimeout, HttpStatus.REQUEST_TIMEOUT);
    }

    public static get BAD_REQUEST() {
        return new this(null, 'Bad Request', AppStatus.BadRequest, HttpStatus.BAD_REQUEST);
    }

    public static get RESOURCE_UNAVAILABLE() {
        return new this(null, 'Service Unavailable', AppStatus.ServiceUnavailable, HttpStatus.SERVICE_UNAVAILABLE);
    }

    public static get NOT_FOUND() {
        return new this(null, 'Resource Not Found', AppStatus.NotFound, HttpStatus.NOT_FOUND);
    }

    public static get ISV_SERVICE_UNAVAILABLE() {
        return new this(null, 'Balance Service Unavailable', AppStatus.ServiceUnavailable, HttpStatus.SERVICE_UNAVAILABLE);
    }

    public static get SHORTENER_SERVICE_UNAVAILABLE() {
        return new this(null, 'Shortener Service Unavailable', AppStatus.ServiceUnavailable, HttpStatus.SERVICE_UNAVAILABLE);
    }

    public static get OPERATION_NOT_ALLOWED() {
        return new this(null, 'Operation not allowed', AppStatus.OperationNotAllowed, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    public static get CONFLICT() {
        return new this(null, `Conflict exception`, AppStatus.ConflictError, HttpStatus.CONFLICT);
    }

    public static get INTEGRATION_ERROR() {
        return new this(null, 'External Integration Exception', AppStatus.IntegrationError, HttpStatus.SERVICE_UNAVAILABLE);
    }

    public static get ServiceUnavailable() {
        return new this(
            null,
            'Service Unavailable',
            AppStatus.ServiceUnavailable,
            HttpStatus.SERVICE_UNAVAILABLE,
        );
    }
}

import { HttpStatus } from '@nestjs/common';
import { AppStatus } from '../helpers/enums.js';
import { CustomException } from './custom-exception.js';

export class AppException extends CustomException {
  constructor(
    err: unknown,
    message = 'App Exception',
    code: string = AppStatus.ApplicationError,
    status: number = HttpStatus.SERVICE_UNAVAILABLE,
  ) {
    super(err, code, status, message);
  }

  public static get ForbiddenRequest(): AppException {
    return new this(null, 'Forbidden Request', AppStatus.Forbidden, HttpStatus.FORBIDDEN);
  }

  public static get BadRequest(): AppException {
    return new this(null, 'Bad Request', AppStatus.BadRequest, HttpStatus.BAD_REQUEST);
  }

  public static get RequestTimeout(): AppException {
    return new this(null, 'Request Timed Out', AppStatus.RequestTimeout, HttpStatus.REQUEST_TIMEOUT);
  }

  public static get ServiceUnavailable(): AppException {
    return new this(null, 'Service Unavailable', AppStatus.ServiceUnavailable, HttpStatus.SERVICE_UNAVAILABLE);
  }

  public static get NotFound(): AppException {
    return new this(null, 'Not Found', AppStatus.NotFound, HttpStatus.NOT_FOUND);
  }

  public static get ReferenceConflict(): AppException {
    return new this(null, 'Reference Conflict', AppStatus.ReferenceConflict, HttpStatus.CONFLICT);
  }

  public static get Conflict(): AppException {
    return new this(null, 'Conflict', AppStatus.Conflict, HttpStatus.CONFLICT);
  }

  public static get Unauthorized(): AppException {
    return new this(null, 'Unauthorized', AppStatus.Unauthorized, HttpStatus.UNAUTHORIZED);
  }
}

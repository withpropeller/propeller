import { HttpStatus } from '@nestjs/common';
import { AppStatus } from '../helpers/enums.js';
import { CustomException } from './custom-exception.js';

export class WorkerException extends CustomException {
  constructor(
    err: unknown,
    code: string = AppStatus.WorkerError,
    status: number = HttpStatus.INTERNAL_SERVER_ERROR,
    message = 'Worker Exception',
  ) {
    super(err, code, status, message);
  }
}

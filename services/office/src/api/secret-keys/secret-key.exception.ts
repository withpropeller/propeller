/*
 * @license
 * Copyright (c) 2021. Allawee
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { CustomException } from '@core/exceptions/custom-exception';
import { HttpStatus } from '@nestjs/common';
import { AccessKeyErrors } from './secret-key.enums';

export class SecretKeyException extends CustomException {
    constructor(
        err: any,
        code: string = AccessKeyErrors.AccessKeyMalfunctioned,
        status: number = HttpStatus.UNAUTHORIZED,
        message?: string,
        body?: any,
    ) {
        super(err, code, status, message, body);
    }
}

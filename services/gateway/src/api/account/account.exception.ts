/*
 * @license
 * Copyright (c) 2020. KolaCredit
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { CustomException } from '@core/exceptions';
import { Utils } from '@core/helpers';
import { HttpStatus } from '@nestjs/common';

export class AccountException extends CustomException {
    constructor(
        err: any,
        code: string,
        status: number = HttpStatus.UNPROCESSABLE_ENTITY,
        message = 'Account Exception',
        body?: any,
    ) {
        super(err, code, status, message, body);
    }

    public static ISV_SERVICE_ERROR(res: any) {
        return new this(Utils.toSentenceCase(res?.error ?? 'Service Error'), res?.code ?? 'isv_service_error');
    }
}

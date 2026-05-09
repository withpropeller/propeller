/*
 * @license
 * Copyright (c) 2020. KolaCredit
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { CustomException } from '@core/exceptions/custom-exception';
import { HttpStatus } from '@nestjs/common';
import { ApiErrors } from './api.enums';

export class ApiException extends CustomException {
    constructor(
        err: any,
        code: string = ApiErrors.ApiError,
        status: number = HttpStatus.UNAUTHORIZED,
        message = 'Api Exception',
        body?: any,
    ) {
        super(err, code, status, message, body);
    }

    public static get NO_DATA() {
        return new this('No data found for this resource', ApiErrors.NoData, HttpStatus.NOT_FOUND);
    }

    public static get BAD_REQUEST() {
        return new this('Bad Request', ApiErrors.BadRequest, HttpStatus.BAD_REQUEST);
    }
}

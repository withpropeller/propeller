/*
 * @license
 * Copyright (c) 2020. KolaCredit
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { CustomException } from '@core/exceptions/custom-exception';
import { HttpStatus } from '@nestjs/common';
import { AuthErrors } from './auth.enums';

export class AuthException extends CustomException {
    constructor(
        err: any,
        code: string,
        status: number = HttpStatus.UNAUTHORIZED,
        message = 'Auth Exception',
        body?: any,
    ) {
        super(err, code, status, message, body);
    }
    public static get INVALID_AUTHORIZATION_TYPE() {
        return new this('Invalid Authorization Type', AuthErrors.INVALID_AUTHORIZATION_TYPE, HttpStatus.UNAUTHORIZED);
    }

    public static get INVALID_AUTHORIZATION_KEY() {
        return new this('Invalid Authorization Key', AuthErrors.INVALID_AUTHORIZATION_KEY, HttpStatus.UNAUTHORIZED);
    }

    public static get MALFORMED_AUTHORIZATION_KEY() {
        return new this('Malformed Authorization Key', AuthErrors.MALFORMED_AUTHORIZATION_KEY, HttpStatus.UNAUTHORIZED);
    }

    public static get AUTHORIZATION_REQUIRED() {
        return new this('Authorization Required', AuthErrors.AuthorizationRequired, HttpStatus.UNAUTHORIZED);
    }

    public static get AccessDenied() {
        return new this('Access Denied', AuthErrors.AccessDenied, HttpStatus.UNAUTHORIZED);
    }
}

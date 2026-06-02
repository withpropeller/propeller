/*
 * @license
 * Copyright (c) 2020. KolaCredit
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { AccountStatus } from '@core/helpers/enums';
import { HttpStatus } from '@nestjs/common';
import { CustomException } from '../core/exceptions/custom-exception';
import { AuthErrors } from './auth.enums';

export class AuthException extends CustomException {
    constructor(
        err: any,
        code: string = AuthErrors.BasicAuthError,
        status: number = HttpStatus.UNAUTHORIZED,
        message = 'Basic Auth Exception',
        body?: any,
    ) {
        super(err, code, status, message, body);
    }

    public static get PasswordNotStrong() {
        return new this('Password not strong', AuthErrors.PasswordNotStrong, HttpStatus.BAD_REQUEST);
    }

    public static get INVALID_PASSWORD() {
        return new this('Invalid Password', AuthErrors.BasicAuthInvalidPassword);
    }

    public static get INVALID_TOKEN() {
        return new this('Invalid Token', AuthErrors.BasicAuthInvalidToken);
    }

    public static get TOKEN_EXPIRED() {
        return new this('Token Expired', AuthErrors.BasicAuthExpiredToken);
    }

    public static get INVALID_MFA_RECOVERY_KEY() {
        return new this('Invalid MFA Recovery Key', AuthErrors.InvalidMfaRecoveryKey);
    }

    public static get TOKEN_REQUIRED() {
        return new this('Token Required', AuthErrors.TokenRequired, HttpStatus.BAD_REQUEST);
    }

    public static get MFA_SETUP_NOT_FOUND() {
        return new this('MFA Setup Not found', AuthErrors.TokenRequired, HttpStatus.NOT_FOUND);
    }

    public static MFA_REQUIRED(body?: Record<any, any>) {
        return new this('MFA Required', AuthErrors.MfaRequired, HttpStatus.UNPROCESSABLE_ENTITY, null, body);
    }

    public static MFA_NOT_ENABLED(body?: Record<any, any>) {
        return new this('MFA Not Enabled', AuthErrors.MfaNotEnabled, HttpStatus.UNPROCESSABLE_ENTITY, null, body);
    }

    public static MFA_ALREADY_EXIST(body?: Record<any, any>) {
        return new this('MFA Already Exist', AuthErrors.MfaAlreadyExist, HttpStatus.CONFLICT, null, body);
    }

    public static ACCOUNT_INACTIVE(
        status:
            | AccountStatus.Pending
            | AccountStatus.Suspended
            | AccountStatus.RequiresActivation
            | AccountStatus.Terminated,
        body?: any,
    ) {
        let code;
        switch (status) {
            case AccountStatus.Pending:
                code = AuthErrors.AccountPending;
                break;
            case AccountStatus.Suspended:
                code = AuthErrors.AccountSuspended;
                break;
            case AccountStatus.RequiresActivation:
                code = AuthErrors.AccountRequiresActivation;
                break;
            case AccountStatus.Terminated:
                code = AuthErrors.AccountTerminated;
                break;
        }
        return new this(undefined, code, HttpStatus.UNAUTHORIZED, `This account is ${status.toLowerCase()}`, body);
    }

    public static get ACCOUNT_NOT_ACTIVE() {
        return new this('Account inactive', AuthErrors.AccountInactive, HttpStatus.BAD_REQUEST);
    }

    public static get IDENTITY_NOT_CONFIRMED() {
        return new this(
            'User identity not confirmed',
            AuthErrors.IdentityNotConfirmed,
            HttpStatus.UNPROCESSABLE_ENTITY,
        );
    }

    public static get USER_ALREADY_EXIST() {
        return new this(
            'Email already exist, please use another email account',
            AuthErrors.UserExist,
            HttpStatus.CONFLICT,
        );
    }

    public static get ONBOARD_CRITERIA_NOT_MET() {
        return new this('Onboard Criteria not met', AuthErrors.OnboardCriteriaNotMet, HttpStatus.UNPROCESSABLE_ENTITY);
    }
}

import { CustomException } from '@core/exceptions';
import { HttpStatus } from '@nestjs/common';
import { ReserveAccountErrors } from './reserve-account.enums';

export class ReserveAccountException extends CustomException {
    constructor(
        err: any,
        code: string,
        status: number = HttpStatus.UNPROCESSABLE_ENTITY,
        message = 'Reserve account Exception',
        body?: any,
    ) {
        super(err, code, status, message, body);
    }

    public static get SlugAlreadyExists() {
        return new this(
            'Reserve account with this slug already exists',
            ReserveAccountErrors.SlugAlreadyExists,
            HttpStatus.BAD_REQUEST,
        );
    }

    public static get DepositCurrencyNotSupported() {
        return new this('Deposit channel not found', ReserveAccountErrors.DepositChannelNotFound, HttpStatus.NOT_FOUND);
    }

    public static get DepositChannelAlreadyExists() {
        return new this(
            'Deposit channel already exists',
            ReserveAccountErrors.DepositChannelAlreadyExists,
            HttpStatus.BAD_REQUEST,
        );
    }
}

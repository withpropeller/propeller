import { AccountErrors } from '@api/account/account.enums';
import { CustomException } from '@core/exceptions';
import { Utils } from '@core/helpers';
import { HttpStatus } from '@nestjs/common';
import { BalanceErrors } from './balance.enums';

export class BalanceException extends CustomException {
    constructor(
        err: any,
        code: string,
        status: number = HttpStatus.UNPROCESSABLE_ENTITY,
        message = 'Balance Exception',
        body?: any,
    ) {
        super(err, code, status, message, body);
    }

    public static get CustomerRequired() {
        return new this('Customer required', AccountErrors.CustomerRequired, HttpStatus.BAD_REQUEST);
    }

    public static get NotFound() {
        return new this('Account not found', AccountErrors.NotFound, HttpStatus.NOT_FOUND);
    }

    public static get NotActive() {
        return new this('Account not active', AccountErrors.NotActive, HttpStatus.BAD_REQUEST);
    }

    public static get InvalidAccountType() {
        return new this('Invalid account type', AccountErrors.InvalidAccountType, HttpStatus.BAD_REQUEST);
    }

    public static get InvalidCurrency() {
        return new this('Invalid currency', AccountErrors.InvalidAccountCurrency, HttpStatus.BAD_REQUEST);
    }

    public static get DepositCurrencyNotSupported() {
        return new this(
            'Deposit currency not supported',
            AccountErrors.DepositCurrencyNotSupported,
            HttpStatus.BAD_REQUEST,
        );
    }

    public static get DepositChannelAlreadyExists() {
        return new this(
            'Deposit channel already exists',
            AccountErrors.DepositChannelAlreadyExists,
            HttpStatus.BAD_REQUEST,
        );
    }

    public static get DepositChannelNotFound() {
        return new this('Deposit channel not found', AccountErrors.DepositChannelNotFound, HttpStatus.NOT_FOUND);
    }

    public static ISV_SERVICE_ERROR(res: any) {
        return new this(Utils.toSentenceCase(res?.error ?? 'Service Error'), res?.code ?? 'service_error');
    }

    public static get InsufficientFunds() {
        return new this('Insufficient Funds', BalanceErrors.InsufficientFunds);
    }
}

import { HttpStatus } from '@nestjs/common';
import { Utils } from '@core/helpers';
import { BalanceErrors } from './balance.enums';
import { GrpcResponseData } from '@common/grpc/grpc.response.data';
import { CustomException } from '@core/exceptions';

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

    public static ISV_SERVICE_ERROR(res: GrpcResponseData<any>) {
        return new this(Utils.toSentenceCase(res.error), res.code);
    }

    public static get InsufficientFunds() {
        return new this('Insufficient Funds', BalanceErrors.InsufficientFunds);
    }
}

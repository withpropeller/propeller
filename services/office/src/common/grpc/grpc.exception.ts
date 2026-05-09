import { CustomException } from '@core/exceptions';
import { AppStatus, Utils } from '@core/helpers';
import { HttpStatus } from '@nestjs/common';
import { GrpcResponseData } from './grpc.interfaces';

export class GrpcException extends CustomException {
    constructor(
        err: any,
        code: string,
        status: number = HttpStatus.UNPROCESSABLE_ENTITY,
        message = 'Application Error',
        body?: any,
    ) {
        super(err, code, status, message, body);
    }

    public static get ServiceUnavailable() {
        return new this('Service Unavailable', AppStatus.ServiceUnavailable);
    }

    static TimeoutResponse() {
        return { code: AppStatus.ApplicationTimeout } as GrpcResponseData;
    }

    public static ApplicationError(res: GrpcResponseData<any>) {
        return new this(Utils.toSentenceCase(res.error), res.code);
    }
}

import { AppStatus } from '@core/helpers';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private statusCodes: Map<number, string>;

    constructor() {
        this.statusCodes = new Map([
            [401, AppStatus.Unauthorized],
            [403, AppStatus.Forbidden],
            [404, AppStatus.NotFound],
            [503, AppStatus.ServiceUnavailable],
            [429, AppStatus.TooManyRequests],
        ]);
    }

    public catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const httpStatus = exception.getStatus();

        const status = this.statusCodes.get(httpStatus) ?? httpStatus;
        let message = exception.getResponse()?.['message'];
        if (status === AppStatus.TooManyRequests) {
            message = 'Too many requests';
        }

        response.status(exception.getStatus()).json({
            code: status,
            message: message,
            error: !message ? exception.getResponse() : undefined,
        });
    }
}

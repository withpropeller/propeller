import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { CustomException } from './custom-exception';
import { JwtService } from '@nestjs/jwt';
import { Utils } from '@core/helpers';
import { ReporterService } from '@common/services/reporter.service';

@Catch(CustomException)
export class CustomExceptionFilter implements ExceptionFilter {
    constructor(private reporter: ReporterService, private jwt: JwtService) {}

    public catch(exception: CustomException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        const requestData = { ...request.body, ...request.query };
        const authHeader = request.headers?.authorization?.split(' ');
        const jwt = authHeader && authHeader[1] ? this.jwt.decode(authHeader[1]) : null;

        const data = {
            code: exception.getCode(),
            message: exception.getMessage(),
            data: exception.getData(),
            error: exception.getError(),
        };

        this.reporter.pushError({
            error: data,
            requestData: Utils.pickKeys(
                requestData,
                '-password -oldPassword -newPassword -stateToken -passcode -token',
            ),
            requestUrl: request.url,
            requestUser: jwt ? jwt['email'] : null,
        });

        response.status(exception.getStatus()).json(data);
    }
}

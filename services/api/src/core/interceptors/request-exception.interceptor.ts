import { ApiVersion, AppStatus, LocalRequestProperty } from '@core/helpers/enums';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CustomException } from '@core/exceptions';
import { AppMessages, beforeApiVersion } from '@core/helpers';
import { AccessKey } from '@core/interfaces';

@Injectable()
export class RequestExceptionInterceptor implements NestInterceptor {
    SUPPORTED_SINCE = ApiVersion.v2024_05_01;

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();

        return next.handle().pipe(
            catchError((exception: CustomException) => {
                return this.handleRequestException(req, res, exception);
            }),
        );
    }

    handleRequestException(request: any, response: any, exception?: CustomException) {
        const apiVersion = request.headers[LocalRequestProperty.ApiVersion];
        const accessKey: AccessKey = request[LocalRequestProperty.AccessKey];

        if (beforeApiVersion(apiVersion, this.SUPPORTED_SINCE) || !accessKey.grpEnabled) {
            return throwError(() => exception);
        }

        if (!(exception instanceof CustomException)) {
            return throwError(() => exception);
        }

        if (exception.getCode() !== AppStatus.ServiceUnavailable) {
            return throwError(() => exception);
        }

        // return observable with request pending
        if (typeof response.status === 'function') {
            response.status(202);
        }

        return of({
            code: AppStatus.RequestAccepted,
            message: AppMessages.RequestAccepted,
            error: exception.toJSON(true),
        });
    }
}

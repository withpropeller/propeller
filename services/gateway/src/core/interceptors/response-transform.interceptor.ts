import { AppStatus } from '@core/helpers';
import { ExecutionContext, Injectable, NestInterceptor, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                if (data && data.data && data.metadata) {
                    return {
                        code: AppStatus.Success,
                        message: 'Request Successful',
                        ...data,
                    };
                }

                if (data && !data.code && typeof data !== 'string') {
                    return {
                        code: AppStatus.Success,
                        message: 'Request Successful',
                        data,
                    };
                }

                if (typeof data === 'string') {
                    return { code: AppStatus.Success, message: data };
                }

                if (data === undefined ) {
                    return { code: AppStatus.Success,  message: 'Request Successful' };
                }

                return data;
            }),
        );
    }
}

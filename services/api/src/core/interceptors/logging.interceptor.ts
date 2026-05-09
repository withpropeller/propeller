import { LocalRequestProperty } from '@core/helpers/enums';
import { CallHandler, ExecutionContext, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { EventTask, EventTasks } from '@core/events';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CustomException } from '@core/exceptions';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    constructor(private eventEmitter: EventEmitter2) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();
        const started = Date.now();

        return next.handle().pipe(
            switchMap((data) => this.logUpstream(started, req, res, data)),
            catchError((exception: CustomException) => {
                this.logUpstream(started, req, res, null, exception);
                return throwError(() => exception);
            }),
        );
    }

    logUpstream(started: number, request: any, response: any, data: any, exception?: CustomException) {
        const req = request.raw ?? request;
        const res = response.raw ?? response;
        const tenantId = req[LocalRequestProperty.TenantId];
        const latency = Date.now() - started;
        let statusCode = res.statusCode;

        if (exception) {
            statusCode = exception.getStatus ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
            data = exception.toJSON ? exception.toJSON(true) : exception;
        }

        if (req.url.includes('/requests')) {
            return of(data);
        }

        const event = new EventTask(EventTasks.ApiLogsCreate, tenantId, {
            request,
            latency,
            data,
            statusCode,
        });
        this.eventEmitter.emit(event.name, event);

        if (data && data.error) {
            delete data.error;
        }

        return of(data);
    }
}

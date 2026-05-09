import { AppStatus, LocalRequestProperty, TenantDataSource } from '@core/helpers';
import { ExecutionContext, Injectable, NestInterceptor, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FastifyRequest, FastifyReply } from 'fastify';
import { parseQueryBoolean } from '@common/api-paging/utils';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest<FastifyRequest>();
        const res = context.switchToHttp().getResponse<FastifyReply>();

        this.transformHeader(req, res);

        return next.handle().pipe(map((data) => this.transformBody(data)));
    }

    transformBody(data: any) {
        if (data && data.data && data.metadata) {
            return { code: AppStatus.Success, ...data };
        }

        if (data && !data.code && typeof data !== 'string') {
            return { code: AppStatus.Success, data };
        }

        if (typeof data === 'string') {
            return { code: AppStatus.Success, message: data };
        }

        if (!data) {
            return { code: AppStatus.Success, message: 'Request successful' };
        }

        return data;
    }

    transformHeader(request: FastifyRequest, response: FastifyReply) {
        const req = request.raw ?? (request as any);
        const tenantId = (req.headers[LocalRequestProperty.DashboardMode] as string) ?? TenantDataSource.Sandbox;
        response.header(LocalRequestProperty.DashboardMode, tenantId);

        if (parseQueryBoolean(req.query?.dryRun)) {
            response.header(LocalRequestProperty.DryRun, true);
        }
    }
}

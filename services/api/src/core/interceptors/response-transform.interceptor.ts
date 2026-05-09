import { AppMessages, AppStatus, LocalRequestProperty } from '@core/helpers';
import { ExecutionContext, Injectable, NestInterceptor, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FastifyRequest, FastifyReply } from 'fastify';
import { parseQueryBoolean } from '@common/api-paging/utils';
import { ModelIdTag, TagMongoId } from '@core/mongo';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest<FastifyRequest>();
        const res = context.switchToHttp().getResponse<FastifyReply>();

        this.transformHeader(req, res);

        return next.handle().pipe(map((data) => this.transformBody(data)));
    }

    transformBody(data: any) {
        if (data && Array.isArray(data.data) && data.metadata) {
            return { code: AppStatus.Success, ...data };
        }

        if (data && !data.code && typeof data !== 'string') {
            return { code: AppStatus.Success, data };
        }

        if (typeof data === 'string') {
            return { code: AppStatus.Success, message: data };
        }

        if (!data) {
            return { code: AppStatus.Success, message: AppMessages.Success };
        }

        return data;
    }

    transformHeader(request: FastifyRequest, response: FastifyReply) {
        const req = request.raw ?? (request as any);
        const accessKey = req[LocalRequestProperty.AccessKey];

        if (!accessKey) {
            return;
        }

        const requestId = TagMongoId(ModelIdTag.Request, req[LocalRequestProperty.AccessKey].requestId);
        response.header(LocalRequestProperty.ApiMode, req[LocalRequestProperty.TenantId]);
        response.header(LocalRequestProperty.ApiVersion, request.headers[LocalRequestProperty.ApiVersion]);

        if (!req.url.includes('/requests/')) {
            response.header(LocalRequestProperty.RequestId, requestId);
        }

        if (parseQueryBoolean(req.query?.dryRun)) {
            response.header(LocalRequestProperty.DryRun, true);
        }
    }
}

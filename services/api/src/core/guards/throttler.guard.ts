import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import { getClientIp } from 'request-ip';
import { LocalRequestProperty } from '@core/helpers';
import { AccessKey, AccessKeyType } from '@core/interfaces';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
    protected async getTracker(request: Record<string, any>): Promise<string> {
        return getClientIp(request) ?? 'unknown';
    }

    protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
        const { context } = requestProps;
        const req = context.switchToHttp().getRequest();

        // Exempt verified internal (machine) callers from throttling. This is keyed
        // off the authenticated AccessKey type set by ApiMiddleware — NOT off the
        // client IP, which is derived from spoofable forwarding headers.
        const accessKey: AccessKey =
            req[LocalRequestProperty.AccessKey] ?? req.raw?.[LocalRequestProperty.AccessKey];
        if (accessKey?.type === AccessKeyType.MachineKey) {
            return true;
        }

        return super.handleRequest(requestProps);
    }
}

import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { getClientIp } from 'request-ip';
import * as ipaddr from 'ipaddr.js';

const MACHINE_KEY_CIDR_WHITELIST = '10.0.0.0/16';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
    protected getTracker(request: Record<string, any>): string {
        return getClientIp(request);
    }

    protected handleRequest(context: ExecutionContext, limit: number, ttl: number): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const ip = getClientIp(req);

        try {
            const range = ipaddr.parseCIDR(MACHINE_KEY_CIDR_WHITELIST);
            let address = ipaddr.parse(ip);
            if (address.kind() === 'ipv6' && range[0].kind() === 'ipv4' && (address as any).isIPv4MappedAddress()) {
                address = (address as any).toIPv4Address();
            }
            if (address.match(range)) {
                return Promise.resolve(true);
            }
        } catch (e) {
            return super.handleRequest(context, limit, ttl);
        }

        return super.handleRequest(context, limit, ttl);
    }
}

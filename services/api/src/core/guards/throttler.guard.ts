import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import { getClientIp } from 'request-ip';
import * as ipaddr from 'ipaddr.js';

const MACHINE_KEY_CIDR_WHITELIST = '10.0.0.0/16';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
    protected async getTracker(request: Record<string, any>): Promise<string> {
        return getClientIp(request) ?? 'unknown';
    }

    protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
        const { context } = requestProps;
        const req = context.switchToHttp().getRequest();
        const ip = await this.getTracker(req);

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
            return super.handleRequest(requestProps);
        }
        return super.handleRequest(requestProps);
    }
}

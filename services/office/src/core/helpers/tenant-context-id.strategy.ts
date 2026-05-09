import { HostComponentInfo, ContextId, ContextIdFactory, ContextIdStrategy } from '@nestjs/core';
import { Request } from 'express';
import { LocalRequestProperty, TenantDataSource } from './enums';
import { Utils } from './utils';
import { getClientIp } from 'request-ip';

const tenants = new Map<string, ContextId>();

export type TenantRequestPayload = {
    tenantId: string;
    forwardedIp?: string;
    forwardedUserAgent?: string;
};

export const GetTenantDataSource = (payload: TenantRequestPayload) => {
    return Utils.safeStringEqual(payload.tenantId, TenantDataSource.Live)
        ? TenantDataSource.Live
        : TenantDataSource.Sandbox;
};

export class AggregateByTenantContextIdStrategy implements ContextIdStrategy {
    attach(contextId: ContextId, request: Request) {
        const tenantId = (request.headers[LocalRequestProperty.DashboardMode] as string) ?? TenantDataSource.Sandbox;
        let tenantSubTreeId: ContextId;

        if (tenants.has(tenantId)) {
            tenantSubTreeId = tenants.get(tenantId);
        } else {
            tenantSubTreeId = ContextIdFactory.create();
            tenants.set(tenantId, tenantSubTreeId);
        }
        const forwardedIp = getClientIp(request);
        const forwardedUserAgent = request.headers['user-agent'] as string;

        // If tree is not durable, return the original "contextId" object
        return {
            resolve: (info: HostComponentInfo) => {
                const context = info.isTreeDurable ? tenantSubTreeId : contextId;
                return context;
            },
            payload: { tenantId, forwardedIp, forwardedUserAgent },
        };
    }
}

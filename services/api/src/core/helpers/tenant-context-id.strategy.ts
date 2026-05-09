import { HostComponentInfo, ContextId, ContextIdFactory, ContextIdStrategy } from '@nestjs/core';
import { LocalRequestProperty, TenantDataSource } from './enums';
import { Utils } from './utils';

const tenants = new Map<string, ContextId>();

export type TenantRequestPayload = { tenantId: string };

export const GetTenantDataSource = (payload: TenantRequestPayload) => {
    return Utils.safeStringEqual(payload.tenantId, TenantDataSource.Live)
        ? TenantDataSource.Live
        : TenantDataSource.Sandbox;
};

export const IsLiveTenantDataSource = (payload: TenantRequestPayload) => {
    return GetTenantDataSource(payload) === TenantDataSource.Live;
};

export const IsSandboxTenantDataSource = (payload: TenantRequestPayload) => {
    return GetTenantDataSource(payload) === TenantDataSource.Sandbox;
};

export const GetTenantContextId = (payload: TenantRequestPayload) => {
    return ContextIdFactory.getByRequest(payload);
};

export class AggregateByTenantContextIdStrategy implements ContextIdStrategy {
    attach(contextId: ContextId, request: any) {
        const tenantId = request[LocalRequestProperty.TenantId] ?? request.raw[LocalRequestProperty.TenantId];

        let tenantSubTreeId: ContextId;

        if (tenants.has(tenantId)) {
            tenantSubTreeId = tenants.get(tenantId);
        } else {
            tenantSubTreeId = ContextIdFactory.create();
            tenants.set(tenantId, tenantSubTreeId);
        }

        // If tree is not durable, return the original "contextId" object
        return {
            resolve: (info: HostComponentInfo) => {
                const context = info.isTreeDurable ? tenantSubTreeId : contextId;
                return context;
            },
            payload: { tenantId },
        };
    }
}

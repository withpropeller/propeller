import { TenantRequestPayload } from '@core/helpers/tenant-context-id.strategy';
import { ClientSession } from 'mongoose';

export interface ExecutionOptions {
    dryRun?: boolean;
    session?: ClientSession;
    sync?: boolean;
    request?: TenantRequestPayload;
}

export interface ExecutionOptionsWithRequest {
    dryRun?: boolean;
    session?: ClientSession;
    sync?: boolean;
    request: TenantRequestPayload;
}

export function ExecutionOptionsWithRequest(
    options: ExecutionOptions,
    request: TenantRequestPayload,
): ExecutionOptionsWithRequest {
    return { ...options, request };
}

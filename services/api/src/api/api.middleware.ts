import { AuthException } from '@core/auth/auth.exception';
import { AccessKeyUtils } from '@core/crypto/generate-access-key';
import { InfraToken, InfraTokenClaims } from '@hyphen/node-common';
import { ApiVersion, LocalRequestProperty, TenantDataSource } from '@core/helpers';
import { TenantRequestPayload } from '@core/helpers/tenant-context-id.strategy';
import { Utils } from '@core/helpers/utils';
import { AccessKey, AccessKeyTag, AccessKeyType } from '@core/interfaces';
import { SecretKeyPermissions } from '@api/secret-keys';
import { ConfigService } from '@config/config.service';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { NextFunction } from 'express';
import { SecretKeyService } from './secret-keys/secret-key.service';
import { Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as ipaddr from 'ipaddr.js';
import { FastifyRequest } from 'fastify';
import { getClientIp } from 'request-ip';

export enum AuthenticationPolicy {
    Bearer = 'Bearer',
    Basic = 'Basic',
    Infra = 'Infra',
}

/**
 * Server-side identity for internal (machine) callers. Previously this lived in
 * an out-of-band Redis blob (`infra:assemble:*`); it is now version-controlled.
 * The machine caller is the trusted gateway acting on behalf of an already
 * authenticated user, so it is granted the full scope set.
 */
const MACHINE_ACCESS_KEY = {
    name: 'gateway-machine',
    scopes: ['*'] as unknown as SecretKeyPermissions[],
    apiVersion: ApiVersion.Current,
    grpEnabled: true,
};

@Injectable()
export class ApiMiddleware implements NestMiddleware {
    private accessKeyServiceTenants = new Map<string, SecretKeyService>();

    constructor(private moduleRef: ModuleRef, private eventEmitter: EventEmitter2, private config: ConfigService) {
        this.setSecretKeyServiceTenants({ tenantId: TenantDataSource.Live });
        this.setSecretKeyServiceTenants({ tenantId: TenantDataSource.Sandbox });
    }

    setSecretKeyServiceTenants(payload: TenantRequestPayload) {
        const accessKeyService = new SecretKeyService(payload, this.moduleRef, this.eventEmitter);
        this.accessKeyServiceTenants.set(payload.tenantId, accessKeyService);
    }

    async use(req: Request, res: Response, next: NextFunction) {
        const authorization = (req.headers as any).authorization;

        if (!authorization) {
            const ip = getClientIp(req);
            console.log('No Authorization Header', ip);
            throw AuthException.AUTHORIZATION_REQUIRED;
        }

        await this.verifyAuthorization(req, authorization);

        next();
    }

    private async verifyAuthorization(req: any, authString: string) {
        const scheme = authString.split(' ')[0];

        let accessKey: AccessKey;
        let tenantId: TenantDataSource;

        if (scheme === AuthenticationPolicy.Infra) {
            [accessKey, tenantId] = await this.authenticateInfra(authString.split(' ')[1]);
        } else {
            const [tag, authToken] = this.extractAuthorization(authString);
            [accessKey, tenantId] = await this.authenticateSecretKey(req, tag, authToken);
        }

        req[LocalRequestProperty.AccessKey] = accessKey;
        req[LocalRequestProperty.TenantId] = tenantId;

        //Set Default Project API Version if no header passed
        if (!req.headers[LocalRequestProperty.ApiVersion]) {
            req.headers[LocalRequestProperty.ApiVersion] = accessKey.apiVersion;
        }
        return true;
    }

    private extractAuthorization(authString: string): [AccessKeyTag, string] {
        const authContent = authString.split(' ');
        const authType = authContent[0];
        const auth = authContent[1];

        // Ensure the right authorization type is passed
        if (typeof AuthenticationPolicy[authType] === 'undefined') {
            throw AuthException.INVALID_AUTHORIZATION_TYPE;
        }

        const authToken = authType === AuthenticationPolicy.Basic ? this.getBasicAuth(auth) : auth;

        if (!authToken.includes('.')) {
            throw AuthException.MALFORMED_AUTHORIZATION_KEY;
        }

        const tag = AccessKeyUtils.getAccessKeyTag(auth);

        if (!Utils.enumToArray(AccessKeyTag).includes(tag)) {
            throw AuthException.MALFORMED_AUTHORIZATION_KEY;
        }

        return [tag as AccessKeyTag, authToken];
    }

    /**
     * Format Basic Auth
     * @param req
     * @param token
     * @returns {Promise<any>}
     */
    private getBasicAuth(auth: string) {
        const token = Buffer.from(auth, 'base64').toString();

        if (!token.includes(':')) {
            throw AuthException.MALFORMED_AUTHORIZATION_KEY;
        }

        return token.split(':')[0];
    }

    /**
     * Authenticate Secret Key
     * @param req
     * @param token
     * @returns {Promise<any>}
     */
    private async authenticateSecretKey(
        req: FastifyRequest,
        tag: AccessKeyTag,
        key: string,
    ): Promise<[AccessKey, TenantDataSource]> {
        const tenantId = tag == AccessKeyTag.LiveKey ? TenantDataSource.Live : TenantDataSource.Sandbox;

        const secretKeyService = this.accessKeyServiceTenants.get(tenantId);

        const secretKey = await secretKeyService.getKey(key, true);

        if (!secretKey) {
            throw AuthException.INVALID_AUTHORIZATION_KEY;
        }

        if (!this.verifyCIDR(req, secretKey.cidrWhitelist)) {
            throw AuthException.AccessDenied;
        }

        const accessKey: AccessKey = {
            type: AccessKeyType.SecretKey,
            id: (secretKey as any).id,
            name: secretKey.name,
            scopes: secretKey.scopes,
            apiVersion: secretKey.apiVersion,
            businessId: new Types.ObjectId(secretKey.business),
            grpEnabled: secretKey.grpEnabled,
            requestId: new Types.ObjectId(),
            cidrWhitelist: secretKey.cidrWhitelist,
        };

        return [accessKey, tenantId];
    }

    /**
     * Authenticate an internal (machine) caller via a signed infra token.
     *
     * Identity claims (business/user/tenant/request) are carried *inside* the
     * HMAC-signed token, so they cannot be spoofed via loose headers. Scopes and
     * other machine metadata come from {@link MACHINE_ACCESS_KEY}, not Redis.
     *
     * Fail-closed: only deployments with API_ALLOW_MACHINE_KEY=true (i.e.
     * api-internal, which is network-isolated) accept this scheme. The public
     * `api` rejects it outright.
     */
    private async authenticateInfra(token: string): Promise<[AccessKey, TenantDataSource]> {
        if (!this.config.API_ALLOW_MACHINE_KEY) {
            throw AuthException.INVALID_AUTHORIZATION_TYPE;
        }

        let claims: InfraTokenClaims;
        try {
            claims = InfraToken.verify(token, this.config.INFRA_SIGNING_KEYS);
        } catch {
            throw AuthException.INVALID_AUTHORIZATION_KEY;
        }

        const tenantId = claims.tenantId as TenantDataSource;
        if (!claims.businessId || !tenantId) {
            throw AuthException.INVALID_AUTHORIZATION_KEY;
        }

        const requestId = Types.ObjectId.isValid(claims.requestId)
            ? new Types.ObjectId(claims.requestId)
            : new Types.ObjectId();

        const accessKey: AccessKey = {
            type: AccessKeyType.MachineKey,
            initiator: claims.userId,
            name: MACHINE_ACCESS_KEY.name,
            scopes: MACHINE_ACCESS_KEY.scopes,
            apiVersion: MACHINE_ACCESS_KEY.apiVersion,
            grpEnabled: MACHINE_ACCESS_KEY.grpEnabled,
            businessId: new Types.ObjectId(claims.businessId),
            requestId,
            cidrWhitelist: [],
        };

        return [accessKey, tenantId];
    }

    private verifyCIDR(req: FastifyRequest, cidrWhitelist: string[]): boolean {
        if (!cidrWhitelist || cidrWhitelist.length === 0) {
            return true;
        }

        const ip = getClientIp(req);
        /*
        if (ip == EVERVAULT_PROXY_IP) {
            return true;
        }*/

        for (const cidr of cidrWhitelist) {
            try {
                const range = ipaddr.parseCIDR(cidr);
                let address = ipaddr.parse(ip);
                if (address.kind() === 'ipv6' && range[0].kind() === 'ipv4' && (address as any).isIPv4MappedAddress()) {
                    address = (address as any).toIPv4Address();
                }
                if (address.match(range)) {
                    return true;
                }
            } catch (e) {
                return false;
            }
        }

        return false;
    }
}

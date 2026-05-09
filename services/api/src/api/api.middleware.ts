import { AuthException } from '@core/auth/auth.exception';
import { AccessKeyUtils } from '@core/crypto/generate-access-key';
import { LocalRequestProperty, RedisKeys, TenantDataSource } from '@core/helpers';
import { TenantRequestPayload } from '@core/helpers/tenant-context-id.strategy';
import { Utils } from '@core/helpers/utils';
import { AccessKey, AccessKeyTag, AccessKeyType } from '@core/interfaces';
import { FloService, floDecodeJson } from '@core/services/flo.service';
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
}

@Injectable()
export class ApiMiddleware implements NestMiddleware {
    private accessKeyServiceTenants = new Map<string, SecretKeyService>();

    constructor(private moduleRef: ModuleRef, private eventEmitter: EventEmitter2, private flo: FloService) {
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
        const [tag, authToken] = this.extractAuthorization(authString);
        const [accessKey, tenantId] = await this.extractAccessKey(req, tag, authToken);

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

    private async extractAccessKey(req: any, tag: AccessKeyTag, authToken: string) {
        if ([AccessKeyTag.MachineKey].includes(tag)) {
            return this.authenticateMachineKey(req, authToken);
        }

        return this.authenticateSecretKey(req, tag, authToken);
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
     * Authenticate Machine Key
     * @param req
     * @param token
     * @returns {Promise<any>}
     */
    private async authenticateMachineKey(req: any, key: string): Promise<[AccessKey, TenantDataSource]> {
        const hashKey = await AccessKeyUtils.getKeyHashFromPlain(key);
        const machineKey = floDecodeJson<AccessKey>(
            (await this.flo.client.kv.jsonGet(`${RedisKeys.Assemble}:${hashKey}`, '$'))?.value ?? null,
        );
        const businessId = req.headers[LocalRequestProperty.BusinessId];
        const tenantId = req.headers[LocalRequestProperty.TenantId];
        const userId = req.headers[LocalRequestProperty.UserId];
        let requestId = req.headers[LocalRequestProperty.RequestId];
        requestId = Types.ObjectId.isValid(requestId) ? new Types.ObjectId(requestId) : new Types.ObjectId();

        if (!machineKey || !businessId || !tenantId) {
            throw AuthException.INVALID_AUTHORIZATION_KEY;
        }

        if (!this.verifyCIDR(req, machineKey.cidrWhitelist)) {
            throw AuthException.AccessDenied;
        }

        const accessKey: AccessKey = {
            type: AccessKeyType.MachineKey,
            initiator: userId,
            name: machineKey.name,
            scopes: machineKey.scopes,
            apiVersion: machineKey.apiVersion,
            grpEnabled: machineKey.grpEnabled,
            businessId: new Types.ObjectId(businessId),
            requestId: requestId,
            cidrWhitelist: machineKey.cidrWhitelist,
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

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SecretKeyPermissions as Permissions } from '@api/secret-keys';
import { LocalRequestProperty } from '@core/helpers';
import { AccessKey } from '@core/interfaces';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    /**
     * - Forbid access to a route without permissions, all route must state permissions
     * - Forbid access if no access object
     * @param context
     * @returns
     */
    async canActivate(context: ExecutionContext) {
        const handler = context.getHandler();

        const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [handler, context.getClass()]);
        if (isPublic) {
            return true;
        }

        const permissions = this.reflector.get<string>('permission', handler) as Permissions;
        if (!permissions) {
            return false;
        }

        const request = context.switchToHttp().getRequest();
        const accessKey: AccessKey =
            request[LocalRequestProperty.AccessKey] ?? request.raw[LocalRequestProperty.AccessKey];

        if (typeof accessKey === 'undefined') {
            return false;
        }

        return this.matchPermissions(permissions, accessKey.scopes || []);
    }

    /**
     * This matches route permissions like - 'billing.qouta.read'
     * to scopes that have one of these [billing.* , billing.qouta.*, billing.qouta.read]
     * @param routePermissions
     * @param scopes
     * @returns
     */
    matchPermissions(routePermissions: Permissions, scopes: string[]) {
        const routePermissionsArr = routePermissions.split('.');
        let scopesArr = scopes.map((v) => v.split('.'));

        for (const i in routePermissionsArr) {
            let hasWildCard = false;

            scopesArr = scopesArr.filter((v) => {
                hasWildCard = hasWildCard || v[i] === '*';
                return v[i] === '*' || v[i] === routePermissionsArr[i];
            });

            if (hasWildCard) {
                break;
            }
        }

        return !(scopesArr.length === 0);
    }
}

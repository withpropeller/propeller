import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ENCRYPTION_PROXY_VENDOR, LocalRequestProperty } from '@core/helpers';
import { AccessKey, AccessKeyType } from '@core/interfaces';

@Injectable()
export class SecureGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    /**
     * - Forbid access to a non-secure route from secure.allawee.com
     * - Forbid access to a secure route not from secure.allawee.com
     * - Allow access to a secure route if the request is from known ip with machine key
     * @param context
     * @returns
     */
    async canActivate(context: ExecutionContext) {
        const req = context.switchToHttp().getRequest();
        const accessKey: AccessKey = req[LocalRequestProperty.AccessKey] ?? req.raw?.[LocalRequestProperty.AccessKey];
        const encryptedBy = req.headers[LocalRequestProperty.EncryptedBy];

        const isSecure = this.reflector.getAllAndOverride<boolean>('isSecure', [
            context.getHandler(),
            context.getHandler(),
        ]);

        if (!isSecure && encryptedBy === ENCRYPTION_PROXY_VENDOR) {
            return false;
        }

        if (isSecure && !encryptedBy && accessKey?.type !== AccessKeyType.MachineKey) {
            return false;
        }

        if (isSecure && encryptedBy && encryptedBy !== ENCRYPTION_PROXY_VENDOR) {
            return false;
        }

        return true;
    }
}

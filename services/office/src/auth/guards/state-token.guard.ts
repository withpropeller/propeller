import { AdminService } from '@api/admins/admin.service';
import { AuthException } from '@auth/auth.exception';
import { USER_REQUEST_PROPERTY } from '@common/helpers';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class StateTokenGuard implements CanActivate {
    constructor(private adminService: AdminService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        // eslint-disable-next-line

        const requestData = { ...req.body, ...req.query };

        if (!requestData.stateToken) {
            throw AuthException.TOKEN_REQUIRED;
        }

        const { userId, code } = this.adminService.decodeStateToken(requestData.stateToken);

        const user = await this.adminService.validateStateToken(userId, code);

        req[USER_REQUEST_PROPERTY] = {
            userId: user.id,
            email: user.email,
            roles: user.roles,
        };

        return true;
    }
}

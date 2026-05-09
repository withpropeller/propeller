import { UsersService } from '@api/users/users.service';
import { AuthException } from '@auth/auth.exception';
import { USER_REQUEST_PROPERTY } from '@common/helpers';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class StateTokenGuard implements CanActivate {
    constructor(private usersService: UsersService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        // eslint-disable-next-line

        const requestData = { ...req.body, ...req.query };

        if (!requestData.stateToken) {
            throw AuthException.TOKEN_REQUIRED;
        }

        const { userId, code } = this.usersService.decodeStateToken(requestData.stateToken);

        const user = await this.usersService.validateStateToken(userId, code);

        req[USER_REQUEST_PROPERTY] = {
            businessId: user.business.toString(),
            userId: user.id,
            email: user.email,
            roles: user.roles,
        };

        return true;
    }
}

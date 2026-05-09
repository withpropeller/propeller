import { UsersService } from '@api/users/users.service';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector, private usersService: UsersService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const roles = this.reflector.getAllAndMerge<string[]>('roles', [context.getHandler(), context.getClass()]);
        if (typeof roles === 'object' && roles.length < 1) return true;
        const request = context.switchToHttp().getRequest();
        // eslint-disable-next-line
        const user = await this.usersService.findById(
            request.user.publicId,
        );
        // TODO: we could change this to something like `user.accountType` then we can uncomment
        // if (roles.includes('ADMIN')) {
        //   return true;
        // } else {
        //   throw new UnauthorizedException();
        // }
        return true;
    }
}

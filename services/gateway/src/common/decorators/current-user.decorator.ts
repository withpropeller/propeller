import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { USER_REQUEST_PROPERTY } from '@common/helpers';
import { User } from '@api/users/user.schema';

export const extractUser = (request): User => request[USER_REQUEST_PROPERTY];

export const CurrentUser = createParamDecorator((data, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? extractUser(request)[data] : extractUser(request);
});

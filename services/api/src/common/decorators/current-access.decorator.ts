import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { LocalRequestProperty } from '@core/helpers/enums';
import { AccessKey } from '@core/interfaces';

export const extractAccess = (request): AccessKey =>
    request[LocalRequestProperty.AccessKey] ?? request.raw[LocalRequestProperty.AccessKey];

export const CurrentAccessKey = createParamDecorator((data, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? extractAccess(request)[data] : extractAccess(request);
});

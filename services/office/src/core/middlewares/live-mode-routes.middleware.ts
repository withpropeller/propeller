import { ConfigService } from '@config/config.service';
import { AppException } from '@core/exceptions';
import { LocalRequestProperty, TenantDataSource, Utils } from '@core/helpers';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';

@Injectable()
export class LiveModeRoutesMiddleware implements NestMiddleware {
    constructor(private readonly config: ConfigService) {}

    async use(req: Request, res: Response, next: NextFunction) {
        const tenant = (req.headers[LocalRequestProperty.DashboardMode] as string) ?? TenantDataSource.Sandbox;

        if (Utils.safeStringEqual(tenant, TenantDataSource.Sandbox) && this.config.inProduction) {
            throw AppException.ForbiddenRequest.setMessage('This route can only be accessed in live mode');
        }
        next();
    }
}

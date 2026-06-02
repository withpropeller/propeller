import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@config/config.service';
import { Request } from 'express';
import { DashboardMode } from '@api/users';
import { BusinessStatus } from '@api/business/business.enums';
import { Business } from '@api/business/business.schema';
import { TenantDataSource } from '@core/helpers';
import { InjectModel } from '@nestjs/mongoose';
import { Model, HydratedDocument, Types } from 'mongoose';

export interface JWTUser {
    businessId: Types.ObjectId;
    userId: Types.ObjectId;
    email: string;
    roles: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectModel(Business.name, TenantDataSource.Core)
        private businessModel: Model<HydratedDocument<Business>>,
        config: ConfigService,
    ) {
        super({
            passReqToCallback: true,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.JWT_SECRET,
        });
    }

    /**
     *
     * TODO: Do further token validation, looking up the publicId in a list of revoked tokens,
     * enabling us to perform token revocation.
     */
    async validate(request: any, payload: any): Promise<JWTUser> {
        const req = request.raw ?? (request as Request);
        const tenant = req.headers['x-dashboard-mode'] ?? DashboardMode.Sandbox;

        if (tenant == DashboardMode.Live) {
            const business = await this.businessModel.findById(payload.org);
            if (business?.status !== BusinessStatus.APPROVED) {
                throw new ForbiddenException();
            }
        }

        return {
            businessId: payload.org,
            userId: payload.sub,
            email: payload.email,
            roles: payload.roles,
        };
    }
}

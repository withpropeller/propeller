import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@config/config.service';
import { Types } from 'mongoose';

export interface JWTUser {
    userId: Types.ObjectId;
    email: string;
    roles: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(config: ConfigService) {
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
        return {
            userId: payload.sub,
            email: payload.email,
            roles: payload.roles,
        };
    }
}

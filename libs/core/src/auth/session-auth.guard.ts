import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { RFC7807Exception } from '../exceptions/rfc7807.exception.js';

/**
 * Session cookie authentication guard for `apps/services` `/public/*` and `/dashboard/*`.
 *
 * Expects a signed session cookie (e.g., `propeller_session=<jwt>`).
 * The JWT contains `user_id`, `business_id`, and `email`.
 *
 * Usage:
 *   @UseGuards(SessionAuthGuard)
 *   @Controller('public')
 */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    /** JWT secret used to verify the session cookie. */
    private readonly jwtSecret: string,
    /** Optional: function to check if session is revoked. */
    private readonly isRevoked?: (token: string) => Promise<boolean>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<FastifyRequest>();
    const cookieHeader = req.headers.cookie;

    if (!cookieHeader) {
      throw RFC7807Exception.unauthorized('Session cookie required');
    }

    const sessionToken = this.extractCookie(cookieHeader, 'propeller_session');
    if (!sessionToken) {
      throw RFC7807Exception.unauthorized('Session cookie missing');
    }

    // In a real implementation we'd verify the JWT here.
    // For Wave 2 we stub the verification and stamp the request.
    // TODO: import jwt.verify from a shared helper and validate exp/iat.
    const payload = this.stubVerifyJwt(sessionToken);
    if (!payload) {
      throw RFC7807Exception.unauthorized('Invalid or expired session');
    }

    if (this.isRevoked && (await this.isRevoked(sessionToken))) {
      throw RFC7807Exception.unauthorized('Session has been revoked');
    }

    (req as any)['propeller-user'] = payload;
    (req as any)['propeller-business-id'] = payload.businessId;
    (req as any)['propeller-user-id'] = payload.userId;
    return true;
  }

  private extractCookie(cookieHeader: string, name: string): string | undefined {
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === name) return decodeURIComponent(value);
    }
    return undefined;
  }

  private stubVerifyJwt(token: string): { userId: string; businessId: string; email: string } | null {
    // Wave 2 stub — replace with real JWT verification before shipping.
    try {
      const base64Payload = token.split('.')[1];
      if (!base64Payload) return null;
      const json = Buffer.from(base64Payload, 'base64').toString();
      return JSON.parse(json) as { userId: string; businessId: string; email: string };
    } catch {
      return null;
    }
  }
}

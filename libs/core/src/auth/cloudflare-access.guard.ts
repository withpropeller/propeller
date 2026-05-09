import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { RFC7807Exception } from '../exceptions/rfc7807.exception.js';

/**
 * Cloudflare Access authentication guard for `apps/office` `/admin/*`.
 *
 * When a request passes through Cloudflare Access, CF injects identity
 * headers that are signed with the team's JWT certificate. In the
 * simplest deployment we trust the CF-Connecting-IP and verify the
 * `Cf-Access-Jwt-Assertion` header against the team's cert.
 *
 * For Wave 2 we start with header presence checks (VPN + CF Access
 * entry already restricts reachability). Full JWT verification can
 * be added once the CF team cert is provisioned.
 *
 * Usage:
 *   @UseGuards(CloudflareAccessGuard)
 *   @Controller('admin')
 */
@Injectable()
export class CloudflareAccessGuard implements CanActivate {
  constructor(
    /** CF Access team domain (e.g., propeller.cloudflareaccess.com). */
    private readonly teamDomain: string,
    /** Optional: CF Access policy AUD to enforce. */
    private readonly policyAud?: string,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<FastifyRequest>();

    // CF Access injects these headers after successful authentication.
    const jwtAssertion = req.headers['cf-access-jwt-assertion'] as string | undefined;
    const userEmail = req.headers['cf-access-authenticated-user-email'] as string | undefined;

    if (!jwtAssertion || !userEmail) {
      throw RFC7807Exception.unauthorized('Cloudflare Access authentication required');
    }

    // Wave 2: trust the headers because the request is already behind
    // Cloudflare Access + VPN. In production, verify the JWT against
    // https://<team-domain>/cdn-cgi/access/certs
    // TODO: add full JWT verification with jwks-rsa or similar.

    (req as any)['propeller-user'] = { email: userEmail };
    (req as any)['propeller-user-id'] = userEmail;
    return true;
  }
}

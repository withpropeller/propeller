import { type ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { RFC7807Exception } from './rfc7807.exception.js';

/**
 * Global exception filter that ensures ALL errors are returned as
 * RFC 7807 Problem Details (or a safe fallback for unexpected errors).
 *
 * Register in AppModule providers:
 *   { provide: APP_FILTER, useClass: RFC7807ExceptionFilter }
 */
@Catch()
export class RFC7807ExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const reply = ctx.getResponse<FastifyReply>();

    if (exception instanceof RFC7807Exception) {
      const body = exception.toJSON();
      void reply.status(exception.getStatus()).send(body);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message = typeof res === 'string' ? res : (res as Record<string, unknown>)?.message ?? 'Error';
      const body = {
        type: 'https://propeller.xyz/errors/http-error',
        title: exception.name,
        status,
        code: 'HTTP_ERROR',
        detail: String(message),
        instance: request.url,
      };
      void reply.status(status).send(body);
      return;
    }

    // Unknown / unexpected — log and return generic 500 (hide internals)
    const status = 500;
    const body = {
      type: 'https://propeller.xyz/errors/internal-error',
      title: 'Internal server error',
      status,
      code: 'INTERNAL_ERROR',
      detail: 'An unexpected error occurred. Please try again later.',
      instance: request.url,
    };
    void reply.status(status).send(body);
  }
}

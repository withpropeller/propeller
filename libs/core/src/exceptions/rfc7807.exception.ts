import { HttpStatus } from '@nestjs/common';
import { CustomException } from './custom-exception.js';

/**
 * RFC 7807 Problem Details exception.
 *
 * Every API error returns a consistent shape:
 *
 *   {
 *     "type": "https://propeller.xyz/errors/business-not-found",
 *     "title": "Business not found",
 *     "status": 404,
 *     "code": "BUSINESS_NOT_FOUND",
 *     "detail": "Business <id> does not exist",
 *     "instance": "/v1/businesses/abc123"
 *   }
 *
 * `type` is a stable URI that identifies the error class.
 * `code` is a machine-readable enum string for client branching.
 * `detail` is human-readable and may include request-specific IDs.
 * `instance` is the request path (or request-id) for log correlation.
 */
export class RFC7807Exception extends CustomException {
  public readonly type: string;
  public readonly rfcCode: string;
  public readonly detail?: string;
  public readonly instance?: string;

  constructor(opts: {
    type: string;
    title: string;
    status: number;
    code: string;
    detail?: string;
    instance?: string;
  }) {
    super(null, opts.code, opts.status, opts.title);
    this.type = opts.type;
    this.rfcCode = opts.code;
    this.detail = opts.detail;
    this.instance = opts.instance;
  }

  toJSON(includeStack?: boolean): {
    type: string;
    title: string;
    status: number;
    code: string;
    detail?: string;
    instance?: string;
    message: string;
    error: unknown;
    data: unknown;
    stack?: string;
  } {
    const out = {
      type: this.type,
      title: this.getMessage(),
      status: this.getStatus(),
      code: this.rfcCode,
      message: this.getMessage(),
      error: this.getError(),
      data: this.getData(),
      stack: includeStack ? this.stack : undefined,
    } as any;
    if (this.detail) out.detail = this.detail;
    if (this.instance) out.instance = this.instance;
    return out;
  }

  // ── Factory helpers ──

  static businessNotFound(businessId: string, instance?: string): RFC7807Exception {
    return new this({
      type: 'https://propeller.xyz/errors/business-not-found',
      title: 'Business not found',
      status: HttpStatus.NOT_FOUND,
      code: 'BUSINESS_NOT_FOUND',
      detail: `Business ${businessId} does not exist`,
      instance,
    });
  }

  static kybNotPassed(businessId: string, kybStatus: string, instance?: string): RFC7807Exception {
    return new this({
      type: 'https://propeller.xyz/errors/business-kyb-not-passed',
      title: 'KYB not passed',
      status: HttpStatus.CONFLICT,
      code: 'BUSINESS_KYB_NOT_PASSED',
      detail: `Business ${businessId} is in kyb_status=${kybStatus}`,
      instance,
    });
  }

  static unauthorized(detail = 'Invalid or missing credentials', instance?: string): RFC7807Exception {
    return new this({
      type: 'https://propeller.xyz/errors/unauthorized',
      title: 'Unauthorized',
      status: HttpStatus.UNAUTHORIZED,
      code: 'UNAUTHORIZED',
      detail,
      instance,
    });
  }

  static forbidden(detail = 'Access denied', instance?: string): RFC7807Exception {
    return new this({
      type: 'https://propeller.xyz/errors/forbidden',
      title: 'Forbidden',
      status: HttpStatus.FORBIDDEN,
      code: 'FORBIDDEN',
      detail,
      instance,
    });
  }

  static badRequest(detail: string, instance?: string): RFC7807Exception {
    return new this({
      type: 'https://propeller.xyz/errors/bad-request',
      title: 'Bad request',
      status: HttpStatus.BAD_REQUEST,
      code: 'BAD_REQUEST',
      detail,
      instance,
    });
  }

  static idempotencyKeyReused(instance?: string): RFC7807Exception {
    return new this({
      type: 'https://propeller.xyz/errors/idempotency-key-reused',
      title: 'Idempotency key reused',
      status: HttpStatus.CONFLICT,
      code: 'IDEMPOTENCY_KEY_REUSED',
      detail: 'The Idempotency-Key has already been used with different parameters',
      instance,
    });
  }

  static idempotencyKeyInProgress(instance?: string): RFC7807Exception {
    return new this({
      type: 'https://propeller.xyz/errors/idempotency-key-in-progress',
      title: 'Idempotency key in progress',
      status: HttpStatus.CONFLICT,
      code: 'IDEMPOTENCY_KEY_IN_PROGRESS',
      detail: 'A request with the same Idempotency-Key is currently being processed',
      instance,
    });
  }
}

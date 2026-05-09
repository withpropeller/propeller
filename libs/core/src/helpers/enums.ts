export enum AppStatus {
  Success = 'success',
  Unauthorized = 'unauthorized',
  Forbidden = 'forbidden',
  BadRequest = 'bad-request',
  NotFound = 'not-found',
  ReferenceConflict = 'reference-conflict',
  Conflict = 'conflict',
  WorkerError = 'WORKER_ERROR',
  ConfigurationError = 'CONFIGURATION_ERROR',
  ApplicationTimeout = 'application-timeout',
  ApplicationError = 'application-error',
  RequestTimeout = 'REQUEST_TIMEOUT',
  ServiceUnavailable = 'service-unavailable',
  TooManyRequests = 'too-many-requests',
  RequestAccepted = 'request-accepted',
}

export enum ApiVersion {
  Current = '2026-01-01',
  v2026_01_01 = '2026-01-01',
}

/**
 * Per-request properties stamped onto Express/Fastify request objects
 * by middleware/interceptors and read downstream by guards/handlers.
 *
 * Header-style values use `propeller-*`; HTTP request-id uses `x-request-id`.
 */
export enum LocalRequestProperty {
  User = 'propeller-user',
  AccessKey = 'propeller-access-key',
  BusinessId = 'propeller-business-id',
  UserId = 'propeller-user-id',
  ForwardedIp = 'propeller-forwarded-ip',
  ForwardedUserAgent = 'propeller-forwarded-user-agent',
  ApiVersion = 'propeller-version',
  RequestId = 'x-request-id',
  ApiMode = 'x-api-mode',
  DryRun = 'x-dry-run',
}

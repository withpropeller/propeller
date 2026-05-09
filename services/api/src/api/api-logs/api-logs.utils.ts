import { AppStatus, Utils } from '@core/helpers';
import { APIRequestStatus } from './api-logs.enums';
import { ApiLogsPayload } from './api-logs.schema';

export const RESPONSE_REDACTION = ['responseBody.data.signingKey', 'responseBody.data.cvv', 'responseBody.data.pan'];
export const REQUEST_REDACTION = ['requestBody.pan', 'requestBody.pin', 'requestBody.cvv'];

export function getApiRequestStatus(responseBody: any, forceHardStop: boolean) {
    if (responseBody && responseBody.code === AppStatus.RequestAccepted && !forceHardStop) {
        return APIRequestStatus.Pending;
    }

    return APIRequestStatus.Completed;
}

export function getApiRequestAttemptFromPayload(payload: ApiLogsPayload, forceHardStop: boolean) {
    if (payload.data && payload.data?.error) {
        payload.data.error = Array.isArray(payload.data.error)
            ? payload.data.error
            : {
                  code: payload.data.error.code,
                  message: payload.data.error.message,
                  error: {
                      code: payload.data.error.error?.code,
                      message: payload.data.error.error?.message,
                      data: payload.data.error.error?.response?.data,
                  },
                  stack: payload.data.error.stack,
              };
    }

    if (payload.data && payload.data?.error && forceHardStop) {
        const responseBody = Utils.isObject(payload.data.error) ? payload.data.error : payload.data;
        return Utils.removeNilValues({
            statusCode: 500,
            responseBody: responseBody,
            latency: payload.latency,
            createdAt: new Date(),
        });
    }

    return Utils.removeNilValues({
        statusCode: payload.statusCode,
        responseBody: payload.data,
        latency: payload.latency,
        createdAt: new Date(),
    });
}

import { AppStatus, Utils } from '@core/helpers';
import { APIRequestStatus } from './api-logs.enums';
import { ApiLogsPayload } from './api-log.schema';

export const RESPONSE_REDACTION = ['responseBody.data.signingKey', 'responseBody.data.cvv', 'responseBody.data.pan'];
export const REQUEST_REDACTION = ['requestBody.pan', 'requestBody.pin', 'requestBody.cvv'];

export function getApiRequestStatus(responseBody: any, forceHardStop: boolean) {
    if (responseBody && responseBody.code === AppStatus.RequestAccepted && !forceHardStop) {
        return APIRequestStatus.Pending;
    }

    return APIRequestStatus.Completed;
}

export function getApiRequestAttemptFromPayload(payload: ApiLogsPayload, forceHardStop: boolean) {
    if (payload.data && payload.data?.error && forceHardStop) {
        return Utils.removeNilValues({
            statusCode: 500,
            responseBody: payload.data?.error,
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

import { EventTask, EventTasks } from '@core/events';
import { Document, Types } from 'mongoose';
import {
    ApiVersion,
    AppStatus,
    beforeApiVersion,
    LocalRequestProperty,
    redactObject,
    TenantDataSource,
    Utils,
} from '@core/helpers';
import { TenantRequestPayload } from '@core/helpers/tenant-context-id.strategy';
import { Injectable, OnModuleInit, PlainLiteralObject } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { instanceToPlain } from 'class-transformer';
import { ApiLogsPayload, ApiRequest } from './api-logs.schema';
import { ApiLogsService } from './api-logs.service';
import { AccessKey } from '@core/interfaces';
import * as querystring from 'querystring';
import * as DeviceDetector from 'device-detector-js';
import { getClientIp } from 'request-ip';
import { OnEvent } from '@nestjs/event-emitter/dist/decorators';
import {
    getApiRequestAttemptFromPayload,
    getApiRequestStatus,
    REQUEST_REDACTION,
    RESPONSE_REDACTION,
} from './api-logs.utils';
import { AppException } from '@core/exceptions';
import { APIRequestStatus } from './api-logs.enums';
import { WebhookEventTypes } from '@api/webhooks/webhook.enums';

@Injectable()
export class ApiLogsListener implements OnModuleInit {
    private serviceTenants = new Map<string, ApiLogsService>();
    private deviceDetector: DeviceDetector;

    constructor(private moduleRef: ModuleRef) {
        this.deviceDetector = new DeviceDetector({ skipBotDetection: true });
    }

    onModuleInit() {
        this.setServiceTenants({ tenantId: TenantDataSource.Live });
        this.setServiceTenants({ tenantId: TenantDataSource.Sandbox });
    }

    setServiceTenants(payload: TenantRequestPayload) {
        const service = new ApiLogsService(payload, this.moduleRef);
        this.serviceTenants.set(payload.tenantId, service);
    }

    @OnEvent(EventTasks.ApiLogsCreate)
    private async handleApiLogsCreateEvent(event: EventTask<ApiLogsPayload>) {
        const service = this.serviceTenants.get(event.tenantId);
        let log = this.buildLog(event.data);

        if (!log || !log.attempts?.length) {
            return;
        }

        if (log.attempts[0].responseBody) {
            log.attempts[0].responseBody = this.transform(log.attempts[0].responseBody);
            log = redactObject(log, RESPONSE_REDACTION);
            log = beforeApiVersion(log.apiVersion, ApiVersion.v2024_05_01) ? redactObject(log, REQUEST_REDACTION) : log;
        }

        try {
            const insertedRequest = await service.repo.createAndSave(log);
            if (log.status === APIRequestStatus.Pending) {
                await service.sendRequestProcessEvents(insertedRequest);
            }
        } catch (err) {
            if (err instanceof AppException && err.getCode() === AppStatus.Conflict) {
                await this.updateExistingLog(service, event.data, log);
            }
        }
    }

    private async updateExistingLog(
        service: ApiLogsService,
        data: ApiLogsPayload,
        log: ApiRequest & { _id: Types.ObjectId },
    ) {
        const update = { $push: { attempts: log.attempts[0] }, status: log.status };
        const updatedRequest = await service.repo.findOneAndUpdate({ _id: log._id, business: log.business }, update);

        if (log.status === APIRequestStatus.Completed) {
            return service.createAndSendWebhookEvent(updatedRequest, WebhookEventTypes.RequestCompleted);
        }

        const req = data.request.raw ?? data.request;
        const forceRetry: boolean = req.headers[LocalRequestProperty.GRPForceRetry];
        if (!Utils.safeBoolean(forceRetry)) {
            return service.sendRequestProcessEvents(updatedRequest);
        }
    }

    private buildLog(payload: ApiLogsPayload): ApiRequest & { _id: Types.ObjectId } {
        const req = payload.request.raw ?? payload.request;

        const path = req.url.split('?')[0].replace('/simulation/grp', '');
        const search = req.originalUrl.split('?')[1];
        const query = payload.request.raw && search ? querystring.parse(search) : req.query;

        if (path == '/health') {
            return;
        }

        const accessKey: AccessKey = req[LocalRequestProperty.AccessKey];
        const forceHardStop = !!req.headers[LocalRequestProperty.GRPForceHardStop];

        const ipAddress = getClientIp(req);
        const deviceData = this.deviceDetector.parse(req.headers['user-agent']);

        const status = getApiRequestStatus(payload.data, forceHardStop);
        const attempt = getApiRequestAttemptFromPayload(payload, forceHardStop);

        let source = Utils.removeNilValues({ ipAddress, ...deviceData });
        let proxySource;

        if (req.headers[LocalRequestProperty.ForwardedIp]) {
            const forwardedIpAddress = req.headers[LocalRequestProperty.ForwardedIp];
            const forwardedDeviceData = this.deviceDetector.parse(req.headers[LocalRequestProperty.ForwardedUserAgent]);
            proxySource = source;
            source = Utils.removeNilValues({
                ipAddress: forwardedIpAddress,
                ...forwardedDeviceData,
            });
        }

        const log = Utils.removeNilValues<ApiRequest & { _id: Types.ObjectId }>({
            _id: accessKey.requestId,
            business: accessKey.businessId,
            secretKey: accessKey.id,
            initiator: accessKey.initiator,
            path,
            method: req.method,
            query,
            requestBody: req.body,
            status,
            apiVersion: req.headers[LocalRequestProperty.ApiVersion],
            source,
            proxySource,
            attempts: [attempt],
        });

        return log;
    }

    transform(response: any) {
        if (this.hasDataProperty(response)) {
            return { ...response, data: this.transform(response.data) };
        }

        if (!Array.isArray(response)) {
            return this.transformToPlain(response);
        }
        return response.map((item) => this.transformToPlain(item));
    }

    transformToPlain(plainOrInstance: PlainLiteralObject) {
        if (plainOrInstance instanceof Document) {
            return plainOrInstance.toJSON();
        }

        if (plainOrInstance && plainOrInstance.constructor) {
            return instanceToPlain(plainOrInstance);
        }

        return plainOrInstance;
    }

    hasDataProperty(response): response is { data: any | any[] } {
        return !!response.data;
    }
}

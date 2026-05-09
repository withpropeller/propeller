import { EnvoyEvent, EnvoyService } from '@common/envoy';
import { ExtractSlackNotificationTo, NotificationJob } from '@common/notifications/notification.job';
import { ConfigService } from '@config/config.service';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

export interface ReporterData {
    error: any;
    requestUrl?: string;
    context?: string;
    tenant?: string;
    message?: string;
    business?: string;
}

@Injectable()
export class ReporterService {
    constructor(
        private readonly config: ConfigService,
        private readonly logger: PinoLogger,
        private readonly envoy: EnvoyService,
    ) {}

    pushError(data: ReporterData) {
        const defaults = {
            context: ReporterService.name,
            message: 'Error Encountered',
        };
        data = { ...defaults, ...data };

        this.sendErrorEvent(data);
        this.logger.error(
            {
                context: data.context,
                error: data.error,
                requestUrl: data.requestUrl,
            },
            data.message,
        );
    }

    pushInfo(opts: { message: any; data?: any; context?: string }) {
        const defaults = {
            context: ReporterService.name,
        };
        opts = { ...defaults, ...opts };

        this.sendInfoEvent(opts);
        this.logger.info({ context: opts.context, data: opts.data }, opts.message);
    }

    async sendErrorEvent(data: ReporterData) {
        const to = ExtractSlackNotificationTo(this.config.SLACK_TOKEN, this.config.SLACK_EVENTS_CHANNEL);
        const content = {
            type: 'error',
            message: data.message,
            source: data.requestUrl,
            business: data.business,
            tenant: data.tenant,
            error: JSON.stringify(data.error),
            context: 'infra.api',
        };

        const payload = new NotificationJob().setTo([to]).setTemplate('notification.pushed').setContent(content);

        return this.envoy.dispatchAsyncOnce(EnvoyEvent.newNotification(payload));
    }

    async sendInfoEvent(opts: { message: any; data?: any; context?: string }) {
        const to = ExtractSlackNotificationTo(this.config.SLACK_TOKEN, this.config.SLACK_EVENTS_CHANNEL);
        const content = {
            type: 'info',
            message: opts.message,
            source: opts.context,
            data: opts.data,
            context: 'infra.api',
        };

        const payload = new NotificationJob().setTo([to]).setTemplate('notification.pushed').setContent(content);

        return this.envoy.dispatchAsyncOnce(EnvoyEvent.newNotification(payload));
    }
}

import { ConfigService } from '@config/config.service';
import { Injectable } from '@nestjs/common';
import { NotificationSenders } from '@core/helpers';
import {
    ExtractSlackNotificationTo,
    INotificationEntity,
    INotificationTo,
    NotificationJob,
} from '@core/jobs/notification.job';
import { EnvoyEvent, EnvoyService } from '@common/envoy';

/**
 * Builds notification job
 * and adds to @{QueueTasks.SEND_NOTIFICATION} queue for processing
 *
 */
@Injectable()
export class NotificationHandler {
    constructor(private readonly config: ConfigService, private readonly envoy: EnvoyService) {}

    handle(
        template: string,
        to: INotificationTo | INotificationTo[],
        additionalContent: Record<string, unknown> = {},
        from: INotificationEntity = NotificationSenders.NO_REPLY,
    ) {
        const defaultContent = {
            app_domain: this.config.APP_DOMAIN,
            site_domain: this.config.MAIN_SITE_DOMAIN,
        };

        const payload = new NotificationJob()
            .setFrom(from)
            .setTo(Array.isArray(to) ? to : [to])
            .setTemplate(template)
            .setContent(Object.assign(defaultContent, additionalContent));

        return this.envoy.dispatchAsyncOnce(EnvoyEvent.newNotification(payload));
    }

    handleSlack(template: string, additionalContent: Record<string, unknown> = {}) {
        return this.handle(
            template,
            ExtractSlackNotificationTo(this.config.SLACK_TOKEN, this.config.SLACK_EVENTS_CHANNEL),
            additionalContent,
        );
    }
}

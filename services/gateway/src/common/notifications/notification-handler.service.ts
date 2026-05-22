import { ConfigService } from '@config/config.service';
import { Injectable } from '@nestjs/common';
import { NotificationSenders } from '@core/helpers';
import { ExtractSlackNotificationTo, INotificationEntity, INotificationTo } from '@core/jobs/notification.job';
import { FloService } from '@core/services/flo.service';

/**
 * Dispatches notification requests to the notification-events Flo stream.
 * The notification worker picks them up and handles delivery (email, push, etc.).
 */
@Injectable()
export class NotificationHandler {
    constructor(private readonly config: ConfigService, private readonly flo: FloService) {}

    handle(
        template: string,
        to: INotificationTo | INotificationTo[],
        additionalContent: Record<string, unknown> = {},
        from: INotificationEntity = NotificationSenders.NO_REPLY,
    ) {
        const payload = {
            type: 'notification.send',
            payload: {
                template,
                from,
                to: Array.isArray(to) ? to : [to],
                content: {
                    app_domain: this.config.APP_DOMAIN,
                    site_domain: this.config.MAIN_SITE_DOMAIN,
                    ...additionalContent,
                },
            },
        };

        return this.flo.append('notification-events', payload);
    }

    handleSlack(template: string, additionalContent: Record<string, unknown> = {}) {
        return this.handle(
            template,
            ExtractSlackNotificationTo(this.config.SLACK_TOKEN, this.config.SLACK_EVENTS_CHANNEL),
            additionalContent,
        );
    }
}

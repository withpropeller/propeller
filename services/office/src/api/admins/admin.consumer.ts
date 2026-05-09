import { SESSION_TOKEN_EXPIRY_SECONDS } from '@auth/auth.constants';
import { ConfigService } from '@config/config.service';
import { EventPublisher, EventTask, EventTasks, EventConsumer } from '@core/events';
import { NotificationTemplates, Utils } from '@core/helpers';
import { ExtractEmailNotificationTo } from '@core/jobs/notification.job';
import { NotificationHandler } from '@common/notifications/notification-handler.service';
import { ShortenService } from '@core/services/shortener.services';
import { Injectable } from '@nestjs/common';
import { HydratedDocument } from 'mongoose';
import { Admin } from './admin.schema';

export interface UserConfirmEmailEvent {
    businessName: string;
    user: HydratedDocument<Admin>;
    business: HydratedDocument<Admin>;
    sessionToken: string;
}

export interface AdminInvitationEmailEvent {
    admin: HydratedDocument<Admin>;
    user: HydratedDocument<Admin>;
    sessionToken: string;
}

@Injectable()
export class AdminConsumer extends EventConsumer {
    public static NAME = 'ADMIN_CONSUMER';

    constructor(
        eventPublisher: EventPublisher,
        private config: ConfigService,
        private notificationHandler: NotificationHandler,
        private shortenerService: ShortenService,
    ) {
        super(AdminConsumer.NAME, eventPublisher);
    }

    public handleEvent(event: EventTask<any>) {
        switch (event.name) {
            case EventTasks.UserConfirmEmail:
                return this.handleConfirmEmailEvent(event);
            case EventTasks.UserResetPasswordEmail:
                return this.handleResetPasswordEmailEvent(event);
            case EventTasks.AdminActivatedEmail:
                return this.handleAccountActivatedEmailEvent(event);
            case EventTasks.AdminInvitationEmail:
                return this.handleInvitationEmailEvent(event);
        }
    }

    private async handleConfirmEmailEvent(event: EventTask<UserConfirmEmailEvent>) {
        const verifyLink = await this.shortenerService.shorten(
            `${this.config.APP_DOMAIN}/confirmation/${event.data.sessionToken}`,
            SESSION_TOKEN_EXPIRY_SECONDS,
        );

        this.notificationHandler.handle(
            NotificationTemplates.ConfirmAccount,
            ExtractEmailNotificationTo(event.data.user),
            {
                firstName: event.data.user.firstName,
                securityToken: event.data.sessionToken,
                verifyLink,
            },
        );
    }

    private async handleResetPasswordEmailEvent(event: EventTask<UserConfirmEmailEvent>): Promise<void> {
        const resetLink = await this.shortenerService.shorten(
            `${this.config.APP_DOMAIN}/reset?token=${event.data.sessionToken}`,
            SESSION_TOKEN_EXPIRY_SECONDS,
        );
        const content = {
            firstName: event.data.user.firstName,
            securityToken: event.data.sessionToken,
            resetLink,
        };

        this.notificationHandler.handle(
            NotificationTemplates.ResetPassword,
            ExtractEmailNotificationTo(event.data.user),
            content,
        );
    }

    private async handleAccountActivatedEmailEvent(event: EventTask<UserConfirmEmailEvent>): Promise<void> {
        const content = {
            firstName: event.data.user.firstName,
        };

        this.notificationHandler.handle(
            NotificationTemplates.AccountActivated,
            ExtractEmailNotificationTo(event.data.user),
            content,
        );
    }

    private async handleInvitationEmailEvent(event: EventTask<AdminInvitationEmailEvent>): Promise<void> {
        const authLink = await this.shortenerService.shorten(
            `${this.config.APP_DOMAIN}/signup/invitation/${event.data.sessionToken}`,
            SESSION_TOKEN_EXPIRY_SECONDS,
        );
        const user = event.data.user;
        const content = {
            adminFirstName: event.data.admin.firstName,
            firstName: user.firstName ? user.firstName : Utils.toTitleCase(user.email.split('@')[0]),
            securityToken: event.data.sessionToken,
            email: user.email,
            authLink,
        };

        this.notificationHandler.handle(
            NotificationTemplates.TeamInvite,
            ExtractEmailNotificationTo(event.data.user),
            content,
        );
    }
}

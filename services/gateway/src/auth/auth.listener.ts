import { EventTask, EventTasks } from '@core/events';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { User, UsersService } from '@api/users';
import { Events, NotificationTemplates } from '@core/helpers';
import { HydratedDocument } from 'mongoose';
import { Business } from '@api/business/business.schema';
import { NotificationHandler } from '@common/notifications/notification-handler.service';
import { ExtractEmailNotificationTo } from '@core/jobs/notification.job';
import { OnboardSurvey } from './onboard/onboard-survey.schema';
import { ConfigService } from '@config/config.service';
import { ReporterService } from '@common/services/reporter.service';
import { AuthRegistryService } from './auth-registry.service';

export interface UserSignupPayload {
    user: HydratedDocument<User>;
    onboard: OnboardSurvey;
}

export interface UserDomainSignupPayload {
    user: HydratedDocument<User>;
    business: HydratedDocument<Business>;
}

export interface UserPayload {
    user: HydratedDocument<User>;
}

@Injectable()
export class AuthListener {
    constructor(
        private notificationHandler: NotificationHandler,
        private usersService: UsersService,
        private authRegistry: AuthRegistryService,
        private config: ConfigService,
        private reporter: ReporterService,
    ) {}

    @OnEvent(EventTasks.UserSignedUp)
    private async handleUserSignedUpEvent(event: EventTask<UserSignupPayload>) {
        const user = event.data.user;
        const onboard = event.data.onboard;
        const sessionToken = await this.usersService.setStateToken(user.id);

        await this.authRegistry.registerEmail(user.email, user.id);

        const content = {
            subject: 'Verify your email to activate your Hyphen account',
            email: user.email,
            firstName: user.firstName,
            businessName: onboard.businessName,
            verifyLink: `${this.config.APP_DOMAIN}/confirmation/${sessionToken}`,
        };

        await this.notificationHandler.handle(
            NotificationTemplates.ConfirmAccount,
            ExtractEmailNotificationTo(user),
            content,
        );

        this.notificationHandler.handleSlack(Events.BusinessCreated, {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            businessName: onboard.businessName,
        });

        await this.reporter.pushInfo({
            message: `A new user(${user.email}) just signed up`,
            data: {
                name: `${user.firstName} ${user.lastName}`,
                business: onboard.businessName,
            },
            context: AuthListener.name,
        });
    }

    @OnEvent(EventTasks.UserAccountActivated)
    private async handleUserAccountActivatedEvent(event: EventTask<UserDomainSignupPayload>) {
        const user = event.data.user;
        const business = event.data.business;

        const content = {
            subject: 'Verify your email to activate your Hyphen account',
            email: user.email,
            firstName: user.firstName,
            businessName: business.name,
        };

        this.notificationHandler.handle(
            NotificationTemplates.AccountActivated,
            ExtractEmailNotificationTo(user),
            content,
        );
    }

    @OnEvent(EventTasks.UserEmailConfirmRequested)
    private async handleUserEmailConfirmRequestedEvent(event: EventTask<UserPayload>): Promise<void> {
        const user = event.data.user;
        const sessionToken = await this.usersService.setStateToken(user.id);

        const content = {
            email: user.email,
            firstName: user.firstName,
            verifyLink: `${this.config.APP_DOMAIN}/confirmation/${sessionToken}`,
        };

        await this.notificationHandler.handle(
            NotificationTemplates.ConfirmAccount,
            ExtractEmailNotificationTo(user),
            content,
        );
    }

    @OnEvent(EventTasks.UserPasswordResetRequested)
    private async handleUserPasswordResetRequestedEvent(event: EventTask<UserPayload>) {
        const user = event.data.user;
        const stateToken = await this.usersService.setStateToken(user.id);

        const content = {
            subject: 'Reset your password for your Hyphen account',
            firstName: user.firstName,
            email: user.email,
            resetLink: `${this.config.APP_DOMAIN}/reset?token=${stateToken}`,
        };

        await this.notificationHandler.handle(
            NotificationTemplates.ResetPassword,
            ExtractEmailNotificationTo(user),
            content,
        );
    }
}

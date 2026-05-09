import { User } from '@api/users';
import { UserConfirmEmailEvent, UserConsumer } from '@api/users/user.consumer';
import { NotificationHandler } from '@common/notifications/notification-handler.service';
import { EventPublisher, EventTask, EventTasks, EventConsumer } from '@core/events';
import { Events } from '@core/helpers';
import { Injectable } from '@nestjs/common';
import { HydratedDocument } from 'mongoose';

export interface BusinessCreateEvent extends UserConfirmEmailEvent {
    businessName: string;
    business: HydratedDocument<User>;
}

@Injectable()
export class BusinessConsumer extends EventConsumer {
    public static NAME = 'BUSINESS_CONSUMER';

    constructor(private eventPublisher: EventPublisher, private notificationHandler: NotificationHandler) {
        super(BusinessConsumer.NAME, eventPublisher);
    }

    public handleEvent(event: EventTask<any>) {
        switch (event.name) {
            case EventTasks.BusinessCreate:
                return this.handleBusinessCreateEvent(event);
        }
    }

    private handleBusinessCreateEvent(event: EventTask<BusinessCreateEvent>) {
        this.notificationHandler.handleSlack(Events.BusinessCreated, {
            firstName: event.data.user.firstName,
            lastName: event.data.user.lastName,
            email: event.data.user.email,
            businessName: event.data.businessName,
        });

        this.eventPublisher.publish(event, UserConsumer.NAME, EventTasks.UserConfirmEmail);
    }
}

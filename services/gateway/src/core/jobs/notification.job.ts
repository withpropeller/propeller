import { User } from '@api/users';
import { MessagingChannel } from '@core/helpers/enums';
import { Job } from './job';


export enum NotificationChannel {
    Email = 'email',
    Phone = 'phone',
    Push = 'push',
    Slack = 'slack',
}

export interface INotificationEntity {
    id: string;
    name: string;
    channel?: MessagingChannel;
}

export interface INotificationTo {
    email?: INotificationEntity;
    phone?: INotificationEntity;
    push?: INotificationEntity;
    slack?: INotificationEntity;
}

export class NotificationJob extends Job {
    private from: INotificationEntity;
    private to: INotificationTo[];
    private template: string;
    private content: Record<string, unknown>;

    constructor() {
        super();
    }

    public setFrom(value: INotificationEntity) {
        this.from = value;
        return this;
    }

    public setTo(value: INotificationTo[]) {
        this.to = value;
        return this;
    }

    public setTemplate(value: string) {
        this.template = value;
        return this;
    }

    public setContent(content: Record<string, unknown>) {
        this.content = content;
        return this;
    }
}

export function ExtractNotificationTo(user: User, allowedChannels = [NotificationChannel.Email, NotificationChannel.Push]) {
    let to: INotificationTo = {};

    if (allowedChannels.includes(NotificationChannel.Email)) {
        to = { ...to, email: { id: user.email, name: user.fullName } };
    }

    if (allowedChannels.includes(NotificationChannel.Phone)) {
        to = { ...to, phone: { id: user.phone, name: user.fullName } };
    }

    if (allowedChannels.includes(NotificationChannel.Push) && user.integration?.onesignal) {
        to = { ...to, push: { id: user.integration.onesignal.id, name: user.fullName } };
    }

    return to;
}

export function ExtractEmailNotificationTo(user: User) {
    return ExtractNotificationTo(user, [NotificationChannel.Email]);
}

export function ExtractPushNotificationTo(user: User) {
    return ExtractNotificationTo(user, [NotificationChannel.Push]);
}

export function ExtractPhoneNotificationTo(user: User) {
    return ExtractNotificationTo(user, [NotificationChannel.Phone]);
}

export function ExtractSlackNotificationTo(token: string, name: string) {
    return { slack: { id: token, name: name } };
}

export function ExtractAllNotificationTo(user: User) {
    return ExtractNotificationTo(user, [NotificationChannel.Email, NotificationChannel.Phone, NotificationChannel.Push]);
}


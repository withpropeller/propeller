import { Job } from './job';
import { IUser } from './notification.interfaces';

export enum MessagingChannel {
    WHATSAPP = 'WHATSAPP',
    SMS = 'SMS',
}


export enum NotificationChannel {
    Email = 'email',
    Phone = 'phone',
    Push = 'push',
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

export function ExtractNotificationTo(user: IUser, allowedChannels = [NotificationChannel.Email, NotificationChannel.Push]): INotificationTo {
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

export function ExtractEmailNotificationTo(user: IUser): INotificationTo  {
    return ExtractNotificationTo(user, [NotificationChannel.Email]);
}

export function ExtractPushNotificationTo(user: IUser): INotificationTo  {
    return ExtractNotificationTo(user, [NotificationChannel.Push]);
}

export function ExtractPhoneNotificationTo(user: IUser): INotificationTo  {
    return ExtractNotificationTo(user, [NotificationChannel.Phone]);
}

export function ExtractSlackNotificationTo(token: string, channel: string): INotificationTo {
    return { slack: { id: token, name: channel } };
}

export function ExtractAllNotificationTo(user: IUser): INotificationTo  {
    return ExtractNotificationTo(user, [NotificationChannel.Email, NotificationChannel.Phone, NotificationChannel.Push]);
}

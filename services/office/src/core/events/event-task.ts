import { IEvent } from './event.interface';

export class EventTask<T = any> implements IEvent<T> {
    readonly tenantId: string;
    readonly consumer: string;
    readonly name: string;
    readonly data: T;

    constructor(consumer: string, name: string, tenantId: string, data: T) {
        this.tenantId = tenantId;
        this.consumer = consumer;
        this.name = name;
        this.data = data;
    }
}

export const EventTasks = {
    BusinessCreate: 'business.create',
    UserConfirmEmail: 'user.confirm-email',
    UserResetPasswordEmail: 'user.reset-password-email',
    AdminInvitationEmail: 'admin.invite-email',
    AdminActivatedEmail: 'admin.activated-email',
};

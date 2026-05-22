import { ExecutionOptions } from '@core/interfaces';
import { IEvent } from './event.interface';

export class EventTask<T = any> implements IEvent<T> {
    readonly tenantId: string;
    readonly consumer?: string;
    readonly name: string;
    readonly data: T;
    readonly options?: ExecutionOptions;

    constructor(name: string, tenantId: string, data: T, options?: ExecutionOptions) {
        this.tenantId = tenantId;
        this.name = name;
        this.data = data;
        this.options = options;
    }
}

export enum EventTasks {
    UserSignedUp = 'user.signed-up',
    BusinessCreate = 'business.create',
    UserConfirmEmail = 'user.confirm-email',
    UserResetPasswordEmail = 'user.reset-password-email',
    UserAccountActivatedEmail = 'user.account-activated-email',
    BusinessApprovalRequested = 'business.approval-requested',
    UserAccountActivated = 'user.account-activated',
    UserEmailConfirmRequested = 'user.email-confirm-requested',
    UserPasswordResetRequested = 'user.password-reset-requested',
}

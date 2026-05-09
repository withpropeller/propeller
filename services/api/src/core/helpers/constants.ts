/*
 * @license
 * Copyright (c) 2018. The Wevied Company.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

export const MONGO_UNIQUE_CONSTRAINT_CODE = 11000;
export const DUPLICATE_UNIQUE_CONSTRAINT_CODE = '23505';
export const COLUMN_NULL_VALUE = 'NULL_VALUE';
export const ENCRYPTION_PROXY_VENDOR = 'evervault.com';
export const DEFAULT_RESET_PIN = '0000';
export const DEFAULT_TERMINATE_PIN = '1111';

export const EmailSubjects = {
    DEVELOPER_WELCOME: 'Welcome to Allawee',
    CONFIRM_ACCOUNT: 'Confirm Your Email',
    RESET_PASSWORD: 'Reset your Password',
    LOAN_DISBURSED: ', your wallet has been credited with',
    LOAN_REPAYED: 'Loan Repayment Alert',
    ORGANIZATION_INVITE: 'You have been invited to Allawee',
    ACCOUNT_ACTIVATED: 'You have been Successfully activated your account',
};

export const EmailTemplates = {
    SIGNIN_ACCOUNT: 'signin-account',
    DEVELOPER_WELCOME: 'developer-welcome',
    CONFIRM_ACCOUNT: 'confirm-account',
    RESET_PASSWORD: 'reset-password',
    ACTIVATE_ACCOUNT: 'activate-account',
    LOAN_REPAYMENT: 'loan-repayment',
    LOAN_DISBURSEMENT: 'loan-disbursement',
    TEAM_INVITE: 'team-invite',
    ACCOUNT_ACTIVATED: 'account-activated',
};

export const EmailSenders = {
    NO_REPLY: { email: 'support@allawee.com', name: 'Allawee' },
    HELLO: { email: 'hello@allawee.com', name: 'Allawee' },
};

export const SMSSenders = {
    APP_NAME: 'Allawee',
};

export const SMSTemplates = {
    CONFIRM_PHONE: 'confirm-phone',
};

export const AppMessages = {
    USER_AVAILABLE: 'User Is Available',
    USER_EXIST: 'User Exist',
    TOKEN_INVALIDATED: 'Token Invalidated',
    ACCOUNT_ACTIVATED: 'Account has been activated',
    EMAIL_CONFIRMED: 'Email has been confirmed',
    PHONE_CONFIRMED: 'Phone has been confirmed',
    BVN_CONFIRMED: 'BVN has been confirmed',
    BVN_ALREADY_CONFIRMED: 'BVN already confirmed',
    BVN_REQUIRES_PHONE_CHALLENGE: 'BVN confirmation requires phone challenge',
    INTEGRATION_ALREADY_EXISTS: 'Integration already exists',
    INTEGRATION_COMPLETE: 'Integration completed',
    CONFIRMATION_EMAIL_SENT: 'Confirmation email has been sent',
    CONFIRMATION_TEXT_SENT: 'Confirmation text has been sent',
    PASSWORD_RESET_EMAIL_SENT: 'A pin reset email has been sent',
    PASSWORD_RESET_SUCCESSFUL: 'Your pin has been successfully changed',
    ACCOUNT_ACTIVATED_SUCCESSFUL: 'Your account has been successfully activated',
    Success: 'Request successful',
    RequestAccepted: `Your request is being processed, we would notify you once it is completed via your registered webhook. Please do not resend the request. You can check the status of the request using the requestId in the response header via the /requests endpoint or via the dashboard.`,
};

export const AppEnvironments = {
    STAGING: 'staging',
    PRODUCTION: 'production',
};

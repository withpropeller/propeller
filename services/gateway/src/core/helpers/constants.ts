/*
 * @license
 * Copyright (c) 2018. The Wevied Company.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

export const DUPLICATE_UNIQUE_CONSTRAINT_CODE = '23505';
export const MONGO_UNIQUE_CONSTRAINT_CODE = 11000;
export const ATLAS_ERROR_CODE = 8000;
export const MODEL_PREFIX_SEPARATOR = '.';

export const EmailSenders = {
    NO_REPLY: { email: 'support@hyphenmoney.com', name: 'Allawee' },
    HELLO: { email: 'hello@hyphenmoney.com', name: 'Allawee' },
    SUPPORT: { email: 'support@hyphenmoney.com', name: 'Allawee' },
};

export const NotificationSenders = {
    NO_REPLY: { id: 'support@hyphenmoney.com', name: 'Allawee' },
    SUPPORT: { id: 'support@hyphenmoney.com', name: 'Allawee' },
};

export const SMSSenders = {
    APP_NAME: 'Allawee',
};

export const SMSTemplates = {
    CONFIRM_PHONE: 'confirm-phone',
    TWO_FACTOR_REQUESTED: 'two-factor-requested',
};

export const AppMessages = {
    SUCCESS: 'Request Successful',
    USER_AVAILABLE: 'User Is Available',
    USER_EXIST: 'User Exist',
    TOKEN_INVALIDATED: 'Token Invalidated',
    ACCOUNT_ACTIVATED: 'Account has been activated',
    EMAIL_CONFIRMED: 'Email has been confirmed',
    PHONE_CONFIRMED: 'Phone has been confirmed',
    BVN_CONFIRMED: 'BVN has been confirmed',
    BVN_ALREDY_CONFIRMED: 'BVN already confirmed',
    IDENTITY_CONFIRMED: 'Identity has been confirmed',
    BVN_REQUIRES_PHONE_CHALLENGE: 'BVN confimation requires phone challenge',
    INTEGRATION_ALREADY_EXISTS: 'Integration already exists',
    INTEGRATION_COMPLETE: 'Integration completed',
    CONFIRMATION_EMAIL_SENT: 'Confirmation email has been sent',
    CONFIRMATION_TEXT_SENT: 'Confirmation text has been sent',
    PASSWORD_RESET_EMAIL_SENT: 'A password reset email has been sent',
    PASSWORD_RESET_SUCCESSFUL: 'Your password has been successfully changed',
    ACCOUNT_ACTIVATED_SUCCESSFUL: 'Your account has been successfully activated',
    TWO_FA_ACTIVATED_SUCCESSFUL: '2FA successfully activated on your account',
    TWO_FA_DEACTIVATED_SUCCESSFUL: '2FA successfully deactivated on your account',
    TWO_FACTOR_ACTIVATION_NEEDED: '2FA Setup on your account, please activate',
    TWO_FACTOR_DEFAULT_SET: '2FA Default set',
};

export enum AuthErrors {
    UserExist = 'user-exists',

    AccountPending = 'account-pending',
    AccountInactive = 'account-inactive',
    AccountSuspended = 'account-suspended',
    AccountTerminated = 'account-terminated',
    AccountExternalized = 'account-externalized',
    AccountRequiresActivation = 'account-requires-activation',
    IdentityNotConfirmed = 'identity-not-confirmed',

    PasswordNotStrong = 'password-not-strong',
    BasicAuthError = 'basic-auth-error',
    BasicAuthInvalidPassword = 'basic-auth-invalid-password',
    BasicAuthInvalidToken = 'basic-auth-invalid-token',
    BasicAuthExpiredToken = 'basic-auth-expired-token',
    OnboardCriteriaNotMet = 'onboard-criteria-not-met',
    TokenRequired = 'token-required',
    MfaRequired = 'mfa-required',
    MfaNotFound = 'mfa-not-found',
    MfaNotEnabled = 'mfa-not-enabled',
    MfaAlreadyExist = 'mfa-exists',
    InvalidMfaRecoveryKey = 'invalid-mfa-recovery-key',
}

export enum TwoFAChannels {
    Email = 'email',
    Phone = 'phone',
    Authenticator = 'authenticator',
}

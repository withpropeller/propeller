import { AuthException } from './auth.exception';

export interface PasswordRequirement {
    label: string;
    validator: (password: string) => boolean;
}

export const passwordRequirements: PasswordRequirement[] = [
    {
        label: 'Must have at least one symbol (!@#$%^&*~_+-)',
        validator: (password) => /[!@#$%^&*~_+\-]/.test(password),
    },
    {
        label: 'Must have at least one lowercase letter',
        validator: (password) => /[a-z]/.test(password),
    },
    {
        label: 'Must have at least one uppercase letter',
        validator: (password) => /[A-Z]/.test(password),
    },
    {
        label: 'Contains at least 8 characters',
        validator: (password) => password.length >= 8,
    },
    {
        label: 'Must have at least one number',
        validator: (password) => /[0-9]/.test(password),
    },
];

/**
 * Validates a password against all password requirements
 * @param password - The password to validate
 * @throws AuthException.PasswordNotStrong if validation fails
 */
export function validatePasswordStrength(password: string): void {
    const failedRequirements = passwordRequirements.filter((req) => !req.validator(password));

    if (failedRequirements.length > 0) {
        throw AuthException.PasswordNotStrong;
    }
}

'use client'

export type PasswordStrengthValue = 'default' | 'weak' | 'moderate' | 'strong'

export function getPasswordStrength(password: string): PasswordStrengthValue {
  if (!password) return 'default'
  if (password.length < 8) return 'weak'

  let types = 0
  if (/[a-z]/.test(password)) types++
  if (/[A-Z]/.test(password)) types++
  if (/\d/.test(password)) types++
  if (/[!@#$%^&*~_+\-]/.test(password)) types++

  if (types <= 1) return 'weak'
  if (types === 2) return 'moderate'
  return 'strong'
}

const STRENGTH_LABEL: Record<Exclude<PasswordStrengthValue, 'default'>, string> = {
  weak: 'Weak',
  moderate: 'Moderate',
  strong: 'Strong',
}

const STRENGTH_LABEL_COLOR: Record<Exclude<PasswordStrengthValue, 'default'>, string> = {
  weak: 'text-action-danger-main',
  moderate: 'text-feedback-warning-main',
  strong: 'text-feedback-success-main',
}

export function PasswordStrength({
  password,
  className,
  showLabel = true,
}: {
  password: string
  className?: string
  showLabel?: boolean
}) {
  const strength = getPasswordStrength(password)

  const seg1 =
    strength === 'weak'
      ? 'bg-action-danger-main'
      : strength === 'moderate'
        ? 'bg-feedback-warning-main'
        : strength === 'strong'
          ? 'bg-feedback-success-main'
          : 'bg-surface-tertiary'

  const seg2 =
    strength === 'moderate'
      ? 'bg-feedback-warning-main'
      : strength === 'strong'
        ? 'bg-feedback-success-main'
        : 'bg-surface-tertiary'

  const seg3 =
    strength === 'strong' ? 'bg-feedback-success-main' : 'bg-surface-tertiary'

  return (
    <div className={className}>
      <div
        className="flex gap-1 w-full"
        role="progressbar"
        aria-label="Password strength"
        aria-valuemin={0}
        aria-valuemax={3}
        aria-valuenow={
          strength === 'default' ? 0 : strength === 'weak' ? 1 : strength === 'moderate' ? 2 : 3
        }
      >
        <div className={`flex-1 h-1 rounded-sm transition-colors ${seg1}`} />
        <div className={`flex-1 h-1 rounded-sm transition-colors ${seg2}`} />
        <div className={`flex-1 h-1 rounded-sm transition-colors ${seg3}`} />
      </div>
      {showLabel && strength !== 'default' && (
        <p className={`mt-1.5 text-xs font-medium ${STRENGTH_LABEL_COLOR[strength]}`}>
          {STRENGTH_LABEL[strength]}
        </p>
      )}
    </div>
  )
}

'use client'

export function scorePassword(pw: string): number {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8) s++
  if (/[a-z]/.test(pw)) s++
  if (/[A-Z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return Math.min(s, 4)
}

const COLORS = ['var(--color-line)', '#E43F6F', '#D9892B', '#3E59F3', '#1F8A5B']
const LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']

export function PasswordStrength({
  password,
  className,
}: {
  password: string
  className?: string
}) {
  const score = scorePassword(password)
  const color = COLORS[score]

  return (
    <div className={`flex flex-col gap-1.5 mt-1 ${className ?? ''}`}>
      <div className="flex gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={score}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-colors"
            style={{ background: score > i ? color : 'var(--color-line)' }}
          />
        ))}
      </div>
      <div className="text-[12px] text-ink-soft">
        {password
          ? `Password strength: ${LABELS[score] || 'Weak'}`
          : 'Use 8+ characters with a mix of letters and numbers'}
      </div>
    </div>
  )
}

// Back-compat for any caller using the old export name
export const getPasswordStrength = scorePassword

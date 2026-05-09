interface PasswordStrengthProps {
  password: string
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const getStrength = (pw: string): { score: number; label: string; color: string } => {
    let score = 0
    if (pw.length >= 8) score++
    if (pw.length >= 12) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++

    const clamped = Math.min(score, 4)
    const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500']
    return { score: clamped, label: labels[clamped]!, color: colors[clamped]! }
  }

  const { score, label, color } = getStrength(password)

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= score ? color : 'bg-surface-tertiary'
            }`}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-content-tertiary">{label}</p>
    </div>
  )
}

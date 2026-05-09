export type Period = { label: string; value: string }

export const PERIODS: Period[] = [
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
]

interface PeriodSelectProps {
  value: Period
  onChange: (period: Period) => void
}

export function PeriodSelect({ value, onChange }: PeriodSelectProps) {
  return (
    <div className="flex bg-surface-secondary rounded-lg p-0.5 border border-border-primary-light">
      {PERIODS.map(p => (
        <button
          key={p.value}
          onClick={() => onChange(p)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
            p.value === value.value
              ? 'bg-surface-primary text-content-primary shadow-sm'
              : 'text-content-tertiary hover:text-content-secondary'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

import { TrendingUp, TrendingDown } from 'lucide-react'

export function Delta({
  value,
  positiveIsGood = true,
  unit = '%',
  context = 'vs previous period',
  className,
}: {
  value: number
  positiveIsGood?: boolean
  unit?: string
  context?: string
  className?: string
}) {
  const isPositive = value >= 0
  const isGood = positiveIsGood ? isPositive : !isPositive
  const Icon = isPositive ? TrendingUp : TrendingDown
  const color = isGood ? 'text-feedback-success-dark' : 'text-feedback-danger-dark'

  return (
    <span className={['inline-flex items-center gap-1 text-xs font-medium', color, className].filter(Boolean).join(' ')}>
      <Icon width={12} height={12} strokeWidth={2} aria-hidden="true" />
      {Math.abs(value)}{unit} {context}
    </span>
  )
}

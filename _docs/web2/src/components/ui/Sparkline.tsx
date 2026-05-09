import { cn } from '@/lib'

interface SparklineProps {
  data?: { value: number; date: string }[]
  className?: string
}

export function Sparkline({ data, className }: SparklineProps) {
  if (!data?.length) return <div className={cn('h-10', className)} />
  const max = Math.max(...data.map(d => d.value))
  const min = Math.min(...data.map(d => d.value))
  const range = max - min || 1

  return (
    <div className={cn('flex items-end gap-0.5 h-10', className)}>
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 bg-action-primary-main rounded-t-sm transition-all"
          style={{ height: `${((d.value - min) / range) * 100}%` }}
        />
      ))}
    </div>
  )
}

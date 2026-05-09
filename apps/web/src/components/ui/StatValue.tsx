import type { ReactNode } from 'react'
import { Skeleton } from '@/lib/pax'

/**
 * Stat card value with a loading state.
 *
 * Empty/no-data is the caller's concern — pass the formatted zero value
 * (e.g. "₦0", "0%", "0") rather than an em-dash. A dashboard of zeros reads
 * as a fresh account; a dashboard of em-dashes reads as a broken system.
 */

type Size = 'md' | 'lg'
type Tone = 'default' | 'danger'

const SIZE_CLASS: Record<Size, string> = {
  md: 'text-xl',
  lg: 'text-2xl',
}

const TONE_CLASS: Record<Tone, string> = {
  default: 'text-content-primary',
  danger:  'text-feedback-danger-dark',
}

export function StatValue({
  label,
  value,
  loading = false,
  caption,
  delta,
  size = 'md',
  tone = 'default',
  className,
}: {
  label: string
  value: ReactNode
  loading?: boolean
  /** Caption shown below the value (e.g. "12 active · 3 inactive"). */
  caption?: ReactNode
  /** Rendered below the value (typically a <Delta />). */
  delta?: ReactNode
  size?: Size
  tone?: Tone
  className?: string
}) {
  return (
    <div className={className}>
      <div className="text-xs font-medium text-content-tertiary mb-2">{label}</div>
      {loading ? (
        <Skeleton className="h-5 w-16" />
      ) : (
        <>
          <div className={`${SIZE_CLASS[size]} font-semibold ${TONE_CLASS[tone]} tabular-nums leading-none`}>
            {value}
          </div>
          {caption && <div className="text-xs text-content-tertiary mt-1.5">{caption}</div>}
          {delta && <div className="mt-1.5">{delta}</div>}
        </>
      )}
    </div>
  )
}

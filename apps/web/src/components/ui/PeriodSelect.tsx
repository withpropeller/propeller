'use client'

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/lib/pax'
import { Calendar } from 'lucide-react'

/**
 * Period range filter.
 *
 * Visually references PAX's `DatePicker.Trigger` (leading calendar icon) while
 * keeping the behaviour of a preset `Select` — the dashboard APIs only accept
 * `7d | 30d | 90d` today, so no custom range.
 */

export const PERIODS = [
  { value: '7d',  label: 'Last 7 days'  },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
] as const

export type Period = (typeof PERIODS)[number]['value']

export function PeriodSelect({
  value,
  onChange,
  className,
}: {
  value: Period
  onChange: (value: Period) => void
  className?: string
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Period)}>
      <SelectTrigger className={['w-40', className].filter(Boolean).join(' ')}>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Calendar className="size-3 shrink-0" strokeWidth={2} aria-hidden="true" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {PERIODS.map(p => (
          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

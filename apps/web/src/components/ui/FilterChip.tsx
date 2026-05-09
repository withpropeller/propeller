'use client'

import { X } from 'lucide-react'

// Dismissible inline filter chip: "Label: Value ×"
// bg-surface-secondary fill signals this is an applied/active state.
export function FilterChip({
  label,
  value,
  onRemove,
}: {
  label: string
  value: string
  onRemove: () => void
}) {
  return (
    <div className="inline-flex items-center h-8 pl-2.5 pr-1 gap-1 text-xs font-medium rounded-lg border border-border-primary-light bg-surface-secondary text-content-secondary">
      <span className="text-content-quaternary">{label}:</span>
      <span>{value}</span>
      <button
        onClick={onRemove}
        className="ml-0.5 w-5 h-5 rounded-md flex items-center justify-center hover:bg-surface-tertiary transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X width={9} height={9} className="text-content-tertiary" />
      </button>
    </div>
  )
}

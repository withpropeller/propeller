'use client'

import { useState, ReactNode } from 'react'
import { Copy, Check } from 'lucide-react'

// ── CopyValue ─────────────────────────────────────────────────────────────────
// Mono text that copies to the clipboard on click. Used for IDs, references,
// BINs — anywhere the user might want to grab a raw value.

export function CopyValue({ value, display }: { value: string; display?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 group/copy font-mono text-xs text-content-primary hover:text-action-primary-main transition-colors"
    >
      <span>{display ?? value}</span>
      {copied ? (
        <Check width={11} height={11} className="text-feedback-success-main shrink-0" />
      ) : (
        <Copy
          width={11}
          height={11}
          className="opacity-0 group-hover/copy:opacity-50 transition-opacity shrink-0"
        />
      )}
    </button>
  )
}

// ── OverviewCell ──────────────────────────────────────────────────────────────
// One cell inside the horizontal overview strip sitting beneath a detail-page
// header. The strip is a flex container with divide-x; each cell provides its
// own label above the value.

export function OverviewCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="px-5 py-3.5 md:flex-1 md:min-w-0">
      <p className="text-xs font-medium text-content-tertiary mb-1.5">{label}</p>
      <div className="text-sm font-medium text-content-primary">{children}</div>
    </div>
  )
}

// ── DetailCell ────────────────────────────────────────────────────────────────
// Label-above-value cell for the 3-column grids used inside detail-page tabs.
// When children is empty, renders a muted em-dash. Pass explicit fallback copy
// (e.g. "No merchant name") as children if the page wants more helpful empty
// messaging.

export function DetailCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-content-tertiary mb-1.5">{label}</p>
      <div className="text-sm font-medium text-content-primary">
        {children || <span className="text-content-tertiary">&mdash;</span>}
      </div>
    </div>
  )
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
// Section title, optionally paired with a trailing action (e.g. an edit button).

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-content-primary">{title}</h3>
      {action}
    </div>
  )
}

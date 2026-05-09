'use client'

import { ReactNode } from 'react'

// ── SectionLabel ──────────────────────────────────────────────────────────────
// Uppercase muted header + full-width hairline rule beneath.
// Use for standalone sections (cards, activity, BIN info) where the label
// visually anchors a group without wrapping children itself.

interface SectionLabelProps {
  children: ReactNode
  tooltip?: ReactNode
  action?: ReactNode
}

export function SectionLabel({ children, tooltip, action }: SectionLabelProps) {
  return (
    <div className="mb-0">
      <div className="flex items-center justify-between pb-2 border-b border-border-primary-light">
        <div className="flex items-center gap-1.5">
          <span className="text-[15px] font-medium text-content-primary">
            {children}
          </span>
          {tooltip && (
            <span className="text-content-tertiary hover:text-content-tertiary transition-colors cursor-help">
              {tooltip}
            </span>
          )}
        </div>
        {action}
      </div>
    </div>
  )
}

// ── PanelSection ──────────────────────────────────────────────────────────────
// Section header + flat label/value rows.
// Header carries a hairline rule that visually anchors the group.

interface PanelSectionProps {
  title: string
  tooltip?: ReactNode
  action?: ReactNode
  children: ReactNode
}

export function PanelSection({ title, tooltip, action, children }: PanelSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between pb-2 border-b border-border-primary-light">
        <div className="flex items-center gap-1.5">
          <h3 className="text-[15px] font-medium text-content-primary">
            {title}
          </h3>
          {tooltip && (
            <span className="text-content-tertiary hover:text-content-tertiary transition-colors cursor-help">
              {tooltip}
            </span>
          )}
        </div>
        {action}
      </div>
      <div className="divide-y divide-border-primary-light">{children}</div>
    </div>
  )
}

// ── PanelRow ──────────────────────────────────────────────────────────────────
// Flat label/value row. Hairline dividers come from the parent divide-y.

interface PanelRowProps {
  label: string
  children: ReactNode
}

export function PanelRow({ label, children }: PanelRowProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-0.5 py-2.5">
      <span className="text-xs font-medium text-content-tertiary shrink-0 min-w-32">
        {label}
      </span>
      <div className="text-sm font-medium text-content-primary text-right flex-1 min-w-0 break-words">
        {children || <span className="text-content-tertiary">—</span>}
      </div>
    </div>
  )
}

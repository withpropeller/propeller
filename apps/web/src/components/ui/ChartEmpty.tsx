'use client'

/**
 * Chart empty states — shared across Sparkline, BarChart, PieChart/Donut.
 *
 * Voice rule: present tense, second person, name why the gate is closed and
 * what unlocks it. Never render a bare "No data".
 */

import type { ReactNode } from 'react'

type Variant = 'sparkline' | 'bars' | 'donut'

interface ChartEmptyProps {
  variant: Variant
  title?: string
  hint?: string
  /** Hex colour used for the faint ghost fills. Matches the chart's series colour. */
  accent?: string
  /** Height in px (sparkline/bars) or diameter (donut). Defaults are sensible per variant. */
  height?: number
  /** Horizontal ghost bar — used for stacked-horizontal variants (e.g. decline reasons). */
  orientation?: 'vertical' | 'horizontal'
  /** Optional CTA or slot rendered below the hint. */
  action?: ReactNode
}

export function ChartEmpty({
  variant,
  title,
  hint,
  accent = '#3EB4FF',
  height,
  orientation = 'vertical',
  action,
}: ChartEmptyProps) {
  if (variant === 'sparkline') return <SparklineEmpty title={title} hint={hint} accent={accent} height={height ?? 90} action={action} />
  if (variant === 'donut')     return <DonutEmpty     title={title} hint={hint} height={height ?? 216} action={action} />
  return <BarsEmpty title={title} hint={hint} accent={accent} height={height ?? 180} orientation={orientation} action={action} />
}

// ─── Copy overlay (shared) ──────────────────────────────────────────────────

function Copy({ title, hint, action }: { title?: string; hint?: string; action?: ReactNode }) {
  const primary = title ?? hint
  const secondary = title ? hint : undefined
  return (
    <div className="relative z-10 flex flex-col items-center gap-1 px-4 text-center">
      {primary && <span className="text-xs font-medium text-content-secondary max-w-[32ch] leading-snug">{primary}</span>}
      {secondary && <span className="text-[11px] text-content-tertiary leading-snug max-w-[32ch]">{secondary}</span>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// ─── Sparkline / area ───────────────────────────────────────────────────────

function SparklineEmpty({
  title, hint, accent, height, action,
}: { title?: string; hint?: string; accent: string; height: number; action?: ReactNode }) {
  return (
    <div className="relative w-full flex items-center justify-center" style={{ height }}>
      {/* Dashed baseline + faint wash */}
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 40"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="chart-empty-spark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={accent} stopOpacity={0.06} />
            <stop offset="100%" stopColor={accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d="M0 22 L100 22 L100 40 L0 40 Z" fill="url(#chart-empty-spark)" />
        <line
          x1="0" y1="22" x2="100" y2="22"
          stroke="var(--color-border-primary-light)"
          strokeWidth="0.5"
          strokeDasharray="1.5 1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <Copy title={title} hint={hint} action={action} />
    </div>
  )
}

// ─── Bars (vertical and horizontal) ─────────────────────────────────────────

const GHOST_HEIGHTS = [42, 68, 56, 80, 34] // deliberate rhythm, not random

function BarsEmpty({
  title, hint, accent, height, orientation, action,
}: { title?: string; hint?: string; accent: string; height: number; orientation: 'vertical' | 'horizontal'; action?: ReactNode }) {
  if (orientation === 'horizontal') {
    return (
      <div className="relative w-full flex flex-col items-center justify-center gap-3" style={{ height }}>
        <div
          className="w-full h-5 rounded border border-dashed"
          style={{
            borderColor: 'var(--color-border-primary-light)',
            backgroundColor: accent,
            opacity: 0.06,
          }}
          aria-hidden="true"
        />
        <Copy title={title} hint={hint} action={action} />
      </div>
    )
  }

  return (
    <div className="relative w-full" style={{ height }}>
      <div className="absolute inset-x-0 bottom-0 top-6 flex items-end justify-around gap-3 px-2" aria-hidden="true">
        {GHOST_HEIGHTS.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-md border-t border-dashed"
            style={{
              height: `${h}%`,
              backgroundColor: accent,
              opacity: 0.08,
              borderTopColor: 'var(--color-border-primary-light)',
            }}
          />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-border-primary-light" aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Copy title={title} hint={hint} action={action} />
      </div>
    </div>
  )
}

// ─── Donut ──────────────────────────────────────────────────────────────────

function DonutEmpty({
  title, hint, height, action,
}: { title?: string; hint?: string; height: number; action?: ReactNode }) {
  const size = Math.min(height - 32, 160)
  const stroke = 18
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r

  return (
    <div className="relative w-full flex items-center justify-center" style={{ height }}>
      <svg width={size} height={size} className="absolute" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-border-primary-light)"
          strokeWidth={stroke}
          strokeDasharray={`${circumference / 24} ${circumference / 48}`}
          strokeLinecap="butt"
        />
      </svg>
      <Copy title={title} hint={hint} action={action} />
    </div>
  )
}

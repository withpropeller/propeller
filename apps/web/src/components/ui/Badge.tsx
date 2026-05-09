'use client'

// Badge — wraps Pax Chip with a two-variant API that enforces the design rule:
//
//   variant="type"    — always neutral/secondary. The label text is the only
//                       differentiator. Callers signal "this is a label, not a
//                       status" — the component handles the rest.
//
//   variant="status"  — semantic color derived from value. The caller passes the
//                       semantic key (value), never a color. The Badge maps it.
//                       Callers never choose colors; colors are never inconsistent.
//
// Usage:
//   <Badge variant="type" value={txn.type} />
//   <Badge variant="status" value={txn.status} />
//   <Badge variant="status" value={customer.kycStatus} context="kyc" />
//   <Badge variant="status" value={recipient.status} />  ← "active" → "Active" (no kyc context)

import { Chip } from '@paystack/pax'

type ChipColor = 'success' | 'error' | 'warning' | 'information' | 'secondary'

interface BadgeProps {
  variant: 'status' | 'type'
  value: string
  context?: string
  children?: React.ReactNode
}

// All status values → Pax Chip semantic color.
// Covers: transaction statuses, account statuses, KYC statuses.
const STATUS_COLOR: Record<string, ChipColor> = {
  // ── Transaction statuses ──────────────────────────────────────────────────
  success: 'success',
  successful: 'success',
  completed: 'success',
  pending: 'information',   // waiting for next step — not a problem, just in-flight
  failed: 'error',
  canceled: 'secondary',    // terminal but not an error — intentionally voided
  cancelled: 'secondary',   // alternate spelling
  reversed: 'secondary',    // terminal, funds returned — same visual weight as canceled
  approved: 'success',
  declined: 'error',

  // ── Card statuses ─────────────────────────────────────────────────────────
  live: 'success',
  blocked: 'error',
  new: 'information',
  terminated: 'error',

  // ── BIN statuses ───────────────────────────────────────────────────────────
  'under-review': 'information',       // in-flight review process
  'approval-requested': 'warning',     // awaiting someone's approval
  // approved: mapped below (success)
  // live: mapped above under card statuses (success)
  suspended: 'error',                  // BIN suspended — problem state

  // ── Account statuses (on-chain) ───────────────────────────────────────────
  active: 'success',
  inactive: 'secondary',
  closed: 'secondary',

  // ── Virtual account statuses (fiat) ───────────────────────────────────────
  open: 'success',          // OPEN → Open (green)
  deactivated: 'secondary', // DEACTIVATED → neutral, not an error

  // ── KYC statuses — 9 states ───────────────────────────────────────────────
  not_started: 'secondary',          // hasn't begun — neutral
  incomplete: 'warning',             // started but stalled — operator should nudge
  awaiting_questionnaire: 'warning', // submitted, needs questionnaire
  awaiting_ubo: 'warning',           // business needs UBO disclosure
  under_review: 'information',       // under compliance review — no action needed
  paused: 'warning',                 // temporarily suspended
  offboarded: 'secondary',           // relationship ended — neutral terminal

  // ── Team member statuses ──────────────────────────────────────────────────
  invited: 'information',               // invitation sent, awaiting acceptance
  'requires-activation': 'information', // API value for an unaccepted invite — displayed as "Invited"

  // ── Recipient statuses ────────────────────────────────────────────────────
  archived: 'secondary', // removed from active use; historical reference only
}

// Display labels for KYC statuses — the API values use snake_case, the UI
// shows human-readable labels.
const KYC_LABELS: Record<string, string> = {
  not_started: 'Not started',
  incomplete: 'Incomplete',
  awaiting_questionnaire: 'Awaiting questionnaire',
  awaiting_ubo: 'Awaiting UBO',
  under_review: 'Under review',
  active: 'Approved',    // ACTIVE = approved customer
  rejected: 'Rejected',
  paused: 'Paused',
  offboarded: 'Offboarded',
}

// Friendlier labels for raw API status values that don't format nicely via formatLabel.
// Covers virtual accounts (open/deactivated/closed) and team members (requires-activation).
const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  deactivated: 'Inactive',
  closed: 'Closed',
  'requires-activation': 'Invited',
  suspended: 'Deactivated',
}

// Pax Chip CVA bug workaround: base styles set bg-surface-primary and
// border-border-primary-main, and color variant classes lose in Tailwind v4's
// CSS ordering. Force the correct semantic bg + border with !important.
// Only needed for colored variants — secondary uses the defaults.
const SEMANTIC_OVERRIDES: Record<string, string> = {
  success: '!bg-feedback-success-light !border-feedback-success-border',
  information: '!bg-feedback-information-light !border-feedback-information-border',
  warning: '!bg-feedback-warning-light !border-feedback-warning-border',
  error: '!bg-feedback-danger-light !border-feedback-danger-border',
}

// Format a raw value for display when no specific label map applies.
// Handles underscores, hyphens, and capitalisation.
// "not_started" → "Not started", "on-chain" → "On‑chain"
function formatLabel(value: string): string {
  if (!value) return ''
  return value
    .replace(/_/g, ' ')
    .replace(/-/g, '\u2011')   // non-breaking hyphen — prevents wrapping at hyphen
    .replace(/^\w/, (c) => c.toUpperCase())
}

// context="kyc" opts into the KYC_LABELS map so 'active' → "Approved".
// Without it, 'active' falls through to formatLabel → "Active".
export function Badge({ variant, value, context, children }: BadgeProps) {
  let label = children

  if (!label) {
    label =
      (context === 'kyc' ? KYC_LABELS[value] : undefined) ??
      ACCOUNT_STATUS_LABELS[value] ??
      formatLabel(value)
  }

  if (variant === 'type') {
    // No value — render "Unspecified" with muted tertiary text, no chip border/background.
    if (!value) {
      return <span className="text-sm text-content-tertiary font-normal">No type</span>
    }
    // All type badges are neutral secondary — the text distinguishes them.
    return (
      <Chip variant="status" color="secondary">
        {label}
      </Chip>
    )
  }

  // variant="status" — semantic color from value, never from the caller
  const color: ChipColor = STATUS_COLOR[value?.toLowerCase()] ?? 'secondary'
  const overrides = SEMANTIC_OVERRIDES[color]

  return (
    <Chip variant="status" color={color} className={overrides}>
      {label}
    </Chip>
  )
}

/**
 * Format utilities for currency, dates, and numbers
 */

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
  USDC: 'USDC',
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency
}

/**
 * Format amount with currency symbol. All amounts come in as the smallest
 * unit (kobo/cents) and are divided by 100 before display.
 */
export function formatAmount(amount: number | null | undefined, currency = 'NGN'): string {
  if (amount === undefined || amount === null) return '—'
  if (isNaN(Number(amount))) return '—'

  const value = Number(amount) / 100

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

  if (currency === 'USDC') return `${formatted} USDC`

  const symbol = getCurrencySymbol(currency)
  return `${symbol}${formatted}`
}

// ── Shared time formatter (12-hour, e.g. "11:20 AM") ───────────────────────
const TIME_FMT = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

// ── Helpers ─────────────────────────────────────────────────────────────────
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isYesterday(date: Date, now: Date): boolean {
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  return isSameDay(date, yesterday)
}

function daysDiff(date: Date, now: Date): number {
  const msPerDay = 86_400_000
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((startOfNow.getTime() - startOfDate.getTime()) / msPerDay)
}

/**
 * Context-aware date-time formatting following the PAX Date & Time spec.
 */
export function formatDatetime(dateString?: string | null): string {
  if (!dateString) return '—'

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '—'

    const now = new Date()
    const diff = daysDiff(date, now)

    if (isSameDay(date, now)) {
      return TIME_FMT.format(date)
    }

    if (isYesterday(date, now)) {
      return `Yesterday, ${TIME_FMT.format(date)}`
    }

    if (diff > 0 && diff < 7) {
      const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date)
      return `${weekday}, ${TIME_FMT.format(date)}`
    }

    if (date.getFullYear() === now.getFullYear()) {
      const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)
      return `${monthDay}, ${TIME_FMT.format(date)}`
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  } catch {
    return '—'
  }
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—'

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '—'

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  } catch {
    return '—'
  }
}

export function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return '—'

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '—'

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)

    if (diffSec < 60) return 'Just now'
    if (diffMin <= 62) return `${diffMin}m ago`

    return formatDatetime(dateString)
  } catch {
    return '—'
  }
}

export function formatCompactNumber(num: number): string {
  if (num === null || num === undefined) return '—'
  if (isNaN(num)) return '—'

  const absNum = Math.abs(num)
  const sign = num < 0 ? '-' : ''

  if (absNum >= 1e9) return `${sign}${(absNum / 1e9).toFixed(1)}B`
  if (absNum >= 1e6) return `${sign}${(absNum / 1e6).toFixed(1)}M`
  if (absNum >= 1e3) return `${sign}${(absNum / 1e3).toFixed(1)}K`

  return String(num)
}

export function getAuthErrorMessage(error: unknown): string | null {
  if (!error) return null
  const err = error as { message?: string; code?: string }
  if (err.message) return err.message
  return null
}

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
 *
 * | Context             | Output example           |
 * |---------------------|--------------------------|
 * | Today               | 11:20 AM                 |
 * | Yesterday           | Yesterday, 9:30 PM       |
 * | Last 7 days         | Fri, 10:30 AM            |
 * | 7 days – 1 year     | Aug 14, 12:30 PM         |
 * | More than 1 year    | April 17, 2024           |
 */
export function formatDatetime(dateString?: string | null): string {
  if (!dateString) return '—'

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '—'

    const now = new Date()
    const diff = daysDiff(date, now)

    // Today → time only
    if (isSameDay(date, now)) {
      return TIME_FMT.format(date)
    }

    // Yesterday
    if (isYesterday(date, now)) {
      return `Yesterday, ${TIME_FMT.format(date)}`
    }

    // Within last 7 days → "Fri, 10:30 AM"
    if (diff > 0 && diff < 7) {
      const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date)
      return `${weekday}, ${TIME_FMT.format(date)}`
    }

    // Within the same year (7 days – 1 year) → "Aug 14, 12:30 PM"
    if (date.getFullYear() === now.getFullYear()) {
      const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)
      return `${monthDay}, ${TIME_FMT.format(date)}`
    }

    // More than 1 year → "April 17, 2024"
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  } catch {
    return '—'
  }
}

/**
 * Format date only (no time).
 * PAX spec: use full month name; abbreviate only when space is limited.
 *
 * Returns: "November 10, 2025"
 */
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

/**
 * Context-aware relative time following the PAX timestamp spec.
 *
 * | Context          | Output                    |
 * |------------------|---------------------------|
 * | < 1 minute       | Just now                  |
 * | 1–62 minutes     | 12m ago                   |
 * | Today (> 1 hr)   | 11:20 AM                  |
 * | Yesterday        | Yesterday, 9:30 PM        |
 * | Last 7 days      | Fri, 10:30 AM             |
 * | > 7 days         | Aug 14, 12:30 PM (or full)|
 */
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

    // Beyond 62 minutes, fall through to context-aware formatting
    return formatDatetime(dateString)
  } catch {
    return '—'
  }
}

/**
 * Format large numbers with K/M/B suffixes
 * 1234 → "1.2K"
 * 1234567 → "1.2M"
 */
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

// ── API error messages ────────────────────────────────────────────────────────

/**
 * Maps a structured API error (thrown by customInstance) to a human-readable
 * string suitable for display in UI. Pass the raw error from React Query's
 * `error` field or from a caught promise rejection.
 *
 * @param error  The error value from React Query or a catch block
 * @param fallback  Optional fallback message (defaults to a generic string)
 */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error) return fallback
  const err = error as any
  const status: number | undefined = err?.status

  if (!status) return "Couldn't reach the server. Check your connection and try again."

  if (status === 400) return err.message || 'Invalid request. Please check your details and try again.'
  if (status === 401) return 'Your session has expired. Please sign in again.'
  if (status === 403) return "You don't have permission to perform this action."
  if (status === 404) return 'The requested resource could not be found.'
  if (status === 409) return err.message || 'A conflict occurred. The resource may already exist.'
  if (status === 422) return err.message || 'The submitted data is invalid. Please review and try again.'
  if (status === 429) return 'Too many requests. Please wait a moment and try again.'
  if (status >= 500)  return 'A server error occurred. Please try again in a moment.'

  return err.message || fallback
}

/**
 * Variant for auth pages — maps login/signup specific errors with more
 * contextual messaging (e.g. 401 means wrong credentials, not expired session).
 */
export function getAuthErrorMessage(error: unknown): string | null {
  if (!error) return null
  const err = error as any
  const status: number | undefined = err?.status

  if (!status) return "Couldn't reach the server. Check your connection and try again."
  if (status === 401) return 'Incorrect email or password. Please try again.'
  if (status === 403) return "Your account doesn't have access to this dashboard."
  if (status === 429) return 'Too many login attempts. Please wait a moment and try again.'
  if (status === 400) return err.message || 'Invalid request. Please check your details.'
  if (status >= 500)  return 'A server error occurred. Please try again in a moment.'

  return err.message || 'Something went wrong. Please try again.'
}

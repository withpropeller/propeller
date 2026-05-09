'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  ChevronRight,
  AlertCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button, Skeleton, toast } from '@/lib/pax'
import { useEventsControllerGetOne, useEventsControllerRetryEvent } from '@/api/events/events'
import { formatAmount, formatDatetime, formatRelativeTime } from '@/lib/format'
import { Badge } from '@/components/ui/Badge'
import { CopyButton } from '@/components/ui/CopyButton'
import { useIssuingNav } from '@/context/IssuingNavContext'

// ── JSON syntax highlighter ───────────────────────────────────────────────────
function highlight(json: unknown): string {
  if (json == null) return ''
  let str: string
  try { str = typeof json === 'string' ? json : JSON.stringify(json, null, 2) }
  catch { str = String(json) }
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        if (/^"/.test(match)) {
          if (/:$/.test(match)) return `<span class="text-sky-400">${match}</span>`
          return `<span class="text-emerald-400">${match}</span>`
        }
        if (/true|false/.test(match)) return `<span class="text-yellow-400">${match}</span>`
        if (/null/.test(match))       return `<span class="text-rose-400">${match}</span>`
        return `<span class="text-purple-400">${match}</span>`
      },
    )
}

function parseJson(value: unknown): unknown {
  try { return typeof value === 'string' ? JSON.parse(value) : value }
  catch { return value }
}

// ── Attempt row ───────────────────────────────────────────────────────────────
const STATUS_DOT: Record<string, string> = {
  success: 'bg-feedback-success-main',
  failed:  'bg-feedback-danger-main',
  pending: 'bg-feedback-information-main',
}
function attemptStatus(code?: number | null) {
  if (!code) return 'pending'
  if (code >= 200 && code < 300) return 'success'
  return 'failed'
}

function AttemptRow({
  attempt,
  expanded,
  onToggle,
}: {
  attempt: any
  expanded: boolean
  onToggle: () => void
}) {
  const [tab, setTab] = useState<'request' | 'response'>('request')
  const status = attemptStatus(attempt.statusCode)
  const dotClass = STATUS_DOT[status] ?? 'bg-content-quaternary'
  const codeClass =
    status === 'success' ? 'text-feedback-success-dark' :
    status === 'failed'  ? 'text-feedback-danger-main'  :
    'text-content-secondary'

  const activeContent = tab === 'request' ? attempt.requestBody : attempt.responseBody

  return (
    <div className="border border-border-primary-light rounded-xl overflow-hidden">
      {/* Summary row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-surface-secondary transition-colors text-left cursor-pointer"
      >
        <div className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-0">
          <div>
            <p className="text-xs text-content-tertiary mb-0.5">Timestamp</p>
            <p className="text-sm text-content-primary whitespace-nowrap">{formatDatetime(attempt.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-content-tertiary mb-0.5">Next retry</p>
            <p className="text-sm text-content-secondary whitespace-nowrap">
              {attempt.retryAt ? formatRelativeTime(attempt.retryAt) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-content-tertiary mb-0.5">Status</p>
            <p className={`text-sm font-mono font-semibold ${codeClass}`}>
              {attempt.statusCode ?? 'Pending'}
            </p>
          </div>
          <div>
            <p className="text-xs text-content-tertiary mb-0.5">Response time</p>
            <p className="text-sm text-content-secondary">
              {attempt.responseTime != null ? `${attempt.responseTime}ms` : '—'}
            </p>
          </div>
        </div>
        {expanded
          ? <ChevronUp width={16} height={16} className="text-content-tertiary shrink-0" />
          : <ChevronDown width={16} height={16} className="text-content-tertiary shrink-0" />
        }
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-border-primary-light">
          {/* URL bar */}
          {attempt.url && (
            <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 shrink-0">URL</span>
              <span className="text-xs font-mono text-slate-300 break-all">{attempt.url}</span>
            </div>
          )}

          {/* Tab bar */}
          <div className="flex items-center border-b border-slate-800 bg-slate-950">
            {(['request', 'response'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={(e) => { e.stopPropagation(); setTab(t) }}
                className={`px-5 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px flex items-center gap-2 ${
                  tab === t
                    ? 'border-sky-400 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'request' ? 'Request body' : 'Response'}
                {t === 'response' && attempt.statusCode && (
                  <span className={`font-mono text-[10px] font-bold ${tab === 'response' ? codeClass : 'text-slate-500'}`}>
                    {attempt.statusCode}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* JSON pane */}
          <div className="bg-slate-950 p-5">
            <pre
              className="text-xs leading-relaxed text-slate-100 overflow-auto whitespace-pre min-h-44 max-h-96"
              dangerouslySetInnerHTML={{
                __html: highlight(parseJson(activeContent)) || '<span class="text-slate-500 italic">No data</span>',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24">
      <div className="space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="grid grid-cols-3 gap-8">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
        <div className="col-span-2 space-y-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [expandedAttempt, setExpandedAttempt] = useState<number | null>(null)

  const { setPageTitle } = useIssuingNav()

  const { data: eventRes, isLoading, error } = useEventsControllerGetOne(id, {
    expand: 'attempts' as any,
  } as any)
  const event: any = (eventRes?.data as any) || null

  useEffect(() => {
    if (event?.type) setPageTitle(event.type)
    return () => setPageTitle(null)
  }, [event?.type, setPageTitle])

  const retryMutation = useEventsControllerRetryEvent()

  async function handleRetry() {
    try {
      await retryMutation.mutateAsync({ id })
      toast({ title: 'Event queued for retry', severity: 'success' })
    } catch (err: any) {
      toast({ title: 'Retry failed', description: err?.message ?? 'Something went wrong.', severity: 'danger' })
    }
  }

  if (isLoading) return <DetailSkeleton />

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-feedback-danger-subtle text-feedback-danger-main rounded-full flex items-center justify-center">
          <AlertCircle width={32} height={32} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-content-primary">Event not found</h3>
          <p className="text-content-tertiary max-w-64 mx-auto text-sm">
            We couldn&rsquo;t retrieve the details for this event.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/developer/events')} className="gap-2">
          <ArrowLeft width={16} height={16} /> Back to Events
        </Button>
      </div>
    )
  }

  const attempts: any[] = event.attempts ?? []
  const isSynced = event.sync === true

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 animate-in fade-in duration-500">
      {/* Breadcrumbs */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3 text-xs font-medium text-content-tertiary">
          <Link href="/dashboard/developer/events" className="hover:text-content-primary transition-colors">
            Events
          </Link>
          <ChevronRight width={12} height={12} />
          <span className="text-content-primary font-mono truncate max-w-xs">{id}</span>
        </div>

        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-5">
            <button
              onClick={() => router.push('/dashboard/developer/events')}
              className="p-2.5 bg-surface-primary hover:bg-surface-secondary border border-border-primary-light rounded-xl cursor-pointer transition-all shadow-whisper group shrink-0"
            >
              <ArrowLeft width={20} height={20} className="text-content-secondary group-hover:text-content-primary transition-colors" />
            </button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xl font-bold font-mono text-content-primary">{event.type}</span>
                <Badge variant="status" value={event.body?.status ?? 'pending'} />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-mono text-content-tertiary">{event.id}</span>
                <CopyButton text={event.id} />
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            color="secondary"
            className="gap-2 shrink-0"
            onClick={handleRetry}
            disabled={isSynced || retryMutation.isPending}
          >
            <RotateCcw width={16} height={16} />
            {retryMutation.isPending ? 'Retrying…' : 'Retry event'}
          </Button>
        </div>
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Col 1 — payload fields */}
        <div className="space-y-5">
          {event.body?.amount != null && (
            <div>
              <p className="text-sm text-content-tertiary mb-1">Amount</p>
              <p className="text-base font-semibold text-content-primary tabular-nums">
                {formatAmount(event.body.amount, event.body.currency)}
              </p>
            </div>
          )}
          {event.body?.currency && (
            <div>
              <p className="text-sm text-content-tertiary mb-1">Currency</p>
              <p className="text-base font-semibold text-content-primary">{event.body.currency}</p>
            </div>
          )}
          {event.body?.channel && (
            <div>
              <p className="text-sm text-content-tertiary mb-1">Channel</p>
              <p className="text-base font-semibold text-content-primary">{event.body.channel}</p>
            </div>
          )}
        </div>

        {/* Col 2 — event metadata */}
        <div className="space-y-5">
          <div>
            <p className="text-sm text-content-tertiary mb-1">Event date</p>
            <p className="text-base font-semibold text-content-primary tabular-nums">
              {formatDatetime(event.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-sm text-content-tertiary mb-1">Event type</p>
            <p className="text-base font-semibold text-content-primary font-mono">{event.type}</p>
          </div>
        </div>

        {/* Col 3 — status + source */}
        <div className="space-y-5">
          <div>
            <p className="text-sm text-content-tertiary mb-1">Status</p>
            <Badge variant="status" value={event.body?.status ?? '—'} />
          </div>
          {event.source && (
            <div>
              <p className="text-sm text-content-tertiary mb-1">Event source ID</p>
              <p className="text-sm font-semibold text-content-primary font-mono break-all">{event.source}</p>
              <Link
                href={`/dashboard/developer/events?source=${event.source}`}
                className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium link"
              >
                See related events <ChevronRight width={14} height={14} />
              </Link>
            </div>
          )}
        </div>

        {/* Network data card — spans if present */}
        {event.body?.networkData && (
          <div className="border border-border-primary-light rounded-2xl p-5 space-y-4 md:col-span-3">
            <p className="text-xs font-bold uppercase tracking-widest text-content-primary">Network data</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-content-tertiary">RRN</p>
                <p className="text-sm font-semibold text-content-primary font-mono">{event.body.networkData.rrn ?? '—'}</p>
              </div>
              <div>
                <p className="text-sm text-content-tertiary">STAN</p>
                <p className="text-sm font-semibold text-content-primary font-mono">{event.body.networkData.stan ?? '—'}</p>
              </div>
              <div>
                <p className="text-sm text-content-tertiary">Card acceptance location</p>
                <p className="text-sm font-semibold text-content-primary break-all">{event.body.networkData.cardAcceptorNameLocation ?? '—'}</p>
              </div>
              <div>
                <p className="text-sm text-content-tertiary">Transaction reference</p>
                <p className="text-sm font-semibold text-content-primary font-mono break-all">{event.body.networkData.reference ?? '—'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Attempts — full width */}
      <div className="bg-surface-primary rounded-2xl p-6 border border-border-primary-light shadow-whisper space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-content-tertiary uppercase tracking-widest">
            Event Attempts
          </h3>
          <span className="text-xs text-content-tertiary tabular-nums">
            {attempts.length} attempt{attempts.length !== 1 ? 's' : ''}
          </span>
        </div>

        {attempts.length === 0 ? (
          <p className="text-sm text-content-tertiary text-center py-8">No delivery attempts yet.</p>
        ) : (
          <div className="space-y-3">
            {attempts.map((attempt: any, i: number) => (
              <AttemptRow
                key={attempt.id || i}
                attempt={attempt}
                expanded={expandedAttempt === i}
                onToggle={() => setExpandedAttempt((prev) => (prev === i ? null : i))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

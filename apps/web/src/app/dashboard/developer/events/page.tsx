'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Activity, X } from 'lucide-react'
import { usePanelContext } from '@/context/PanelContext'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/lib/pax'
import { useEventsControllerGet } from '@/api/events/events'
import { DataTable } from '@/components/ui/DataTable'
import { formatDatetime } from '@/lib/format'

// ── Event type chip ───────────────────────────────────────────────────────────
const EVENT_TYPE_COLORS: Record<string, string> = {
  'card.': 'information',
  'payment.': 'success',
  'dispute.': 'warning',
  'request.': 'secondary',
}
const CHIP_OVERRIDES: Record<string, string> = {
  success:     '!bg-feedback-success-light !border-feedback-success-border !text-feedback-success-dark',
  information: '!bg-feedback-information-light !border-feedback-information-border !text-feedback-information-dark',
  warning:     '!bg-feedback-warning-light !border-feedback-warning-border !text-feedback-warning-dark',
  secondary:   '',
}

function eventTypeColor(type?: string) {
  for (const [prefix, color] of Object.entries(EVENT_TYPE_COLORS)) {
    if (type?.startsWith(prefix)) return color
  }
  return 'secondary'
}

function EventTypeChip({ type }: { type?: string }) {
  const color = eventTypeColor(type)
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-xs font-medium ${CHIP_OVERRIDES[color] ?? 'border-border-primary-light bg-surface-secondary text-content-secondary'}`}>
      {type}
    </span>
  )
}

// ── Filter options ────────────────────────────────────────────────────────────
const EVENT_TYPE_OPTIONS = [
  { label: 'All types', value: '' },
  { label: 'card.created', value: 'card.created' },
  { label: 'card.activated', value: 'card.activated' },
  { label: 'card.authorization.request', value: 'card.authorization.request' },
  { label: 'card.authorization.closed', value: 'card.authorization.closed' },
  { label: 'card.authorization.update', value: 'card.authorization.update' },
  { label: 'card.transaction.created', value: 'card.transaction.created' },
  { label: 'payment.completed', value: 'payment.completed' },
  { label: 'payment.authorization.approved', value: 'payment.authorization.approved' },
  { label: 'payment.authorization.activated', value: 'payment.authorization.activated' },
  { label: 'dispute.updated', value: 'dispute.updated' },
  { label: 'request.completed', value: 'request.completed' },
  { label: 'request.cancelled', value: 'request.cancelled' },
]

export default function EventsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { panelState, openPanel } = usePanelContext()
  const panelOpen = panelState.type !== null

  const COLUMNS = [
    {
      header: 'Event ID',
      render: (ev: any) => (
        <span className="text-sm font-mono text-content-secondary">{ev.id}</span>
      ),
    },
    {
      header: 'Event type',
      render: (ev: any) => <EventTypeChip type={ev.type} />,
    },
    {
      header: 'Attempts',
      render: (ev: any) => (
        <span className="text-sm tabular-nums text-content-secondary">
          {ev.attempts?.length ?? 0}
        </span>
      ),
    },
    {
      header: 'Time',
      className: 'text-right',
      render: (ev: any) => (
        <span className="text-sm text-content-secondary max-w-[200px] truncate block">
          {formatDatetime(ev.createdAt)}
        </span>
      ),
    },
  ]

  const type   = searchParams.get('type')   ?? ''
  const before = searchParams.get('before') ?? ''
  const after  = searchParams.get('after')  ?? ''

  const updateParam = (key: string, val: string) => {
    const next = new URLSearchParams(searchParams.toString())
    if (val) next.set(key, val); else next.delete(key)
    next.delete('before')
    next.delete('after')
    router.push(`?${next.toString()}`)
  }

  const handlePageChange = (dir: 'before' | 'after', cursorValue: string) => {
    const next = new URLSearchParams(searchParams.toString())
    next.delete('before')
    next.delete('after')
    if (cursorValue) next.set(dir, cursorValue)
    router.push(`?${next.toString()}`)
  }

  const queryParams: Record<string, any> = { limit: 20 }
  if (type)   queryParams.filter = `type|eq|${type}`
  if (before) queryParams.before = before
  if (after)  queryParams.after  = after

  const { data, isLoading, error, refetch } = useEventsControllerGet(queryParams as any)
  const events: any[] = (data?.data as any) ?? []
  const hasMore = (data as any)?.metadata?.hasMore ?? false
  const hasPrevious = !!before

  const activeFilterCount = [type].filter(Boolean).length
  const typeLabel = EVENT_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? ''

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-content-primary leading-snug">Events</h1>
        <p className="text-sm text-content-tertiary mt-1">
          Monitor event deliveries and retry failed attempts.
        </p>
      </div>

      <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {type ? (
              <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-border-primary-main bg-surface-primary cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                Event type{' '}
                <span className="text-content-tertiary">is</span>{' '}
                {typeLabel}
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); updateParam('type', '') }}
                  className="ml-0.5 leading-none cursor-pointer"
                >
                  <X width={8} height={8} />
                </button>
              </div>
            ) : (
              <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-dashed border-border-primary-dark bg-surface-primary shadow-whisper cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                Event type
              </div>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 max-h-72 overflow-y-auto">
            <DropdownMenuLabel>Event type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={type} onValueChange={(v) => updateParam('type', v)}>
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                  {opt.label || 'All types'}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {activeFilterCount > 0 && (
          <button
            onClick={() => updateParam('type', '')}
            className="text-sm font-semibold text-action-primary-main cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      <DataTable
        data={events}
        columns={COLUMNS}
        isLoading={isLoading}
        error={error ? ((error as any)?.message ?? 'Failed to load events') : null}
        onRetry={refetch}
        onRowClick={(row) => openPanel('event', row.id)}
        pagination={{ hasMore, hasPrevious, onPageChange: handlePageChange }}
        emptyState={{
          icon: <Activity width={20} height={20} />,
          title: 'No events found',
          description: type
            ? 'No events match the selected type.'
            : 'Events will appear here once activity is recorded.',
        }}
        resourceName="events"
      />
      </div>
    </div>
  )
}

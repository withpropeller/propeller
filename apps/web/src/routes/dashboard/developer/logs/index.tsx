'use client'

import { useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from '@/lib/routing'
import { Terminal, Search, X } from 'lucide-react'
import {
  Chip,
  InputGroup, InputGroupAddon, InputGroupInput,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/lib/pax'
import { useApiRequestsControllerGet } from '@/api/requests/requests'
import { type ApiHydratedApiRequest } from '@/api/model'
import { usePanelContext } from '@/context/PanelContext'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatDatetime } from '@/lib/format'

// ── Chips ─────────────────────────────────────────────────────────────────────
const CHIP_OVERRIDES: Record<string, string> = {
  success:     '!bg-feedback-success-light !border-feedback-success-border !text-feedback-success-dark',
  warning:     '!bg-feedback-warning-light !border-feedback-warning-border !text-feedback-warning-dark',
  error:       '!bg-feedback-danger-light !border-feedback-danger-border !text-feedback-danger-main',
  information: '!bg-feedback-information-light !border-feedback-information-border !text-feedback-information-dark',
}

function statusColor(status: string) {
  if (status === 'completed') return 'success'
  if (status === 'cancelled') return 'error'
  return 'secondary'
}

function StatusChip({ status }: { status: string }) {
  const color = statusColor(status)
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : status
  return (
    <Chip variant="status" color={color as any} className={CHIP_OVERRIDES[color] ?? ''}>
      {label}
    </Chip>
  )
}

function MethodChip({ method }: { method: string }) {
  const isPost = method?.toUpperCase() === 'POST'
  const color = isPost ? 'information' : 'secondary'
  return (
    <Chip variant="status" color={color as any} className={CHIP_OVERRIDES[color] ?? ''}>
      {method?.toUpperCase()}
    </Chip>
  )
}

// ── Filter options ────────────────────────────────────────────────────────────
const METHOD_OPTIONS = [
  { label: 'All methods', value: '' },
  { label: 'GET',  value: 'GET' },
  { label: 'POST', value: 'POST' },
]

const STATUS_OPTIONS = [
  { label: 'All statuses', value: '' },
  { label: 'Completed',   value: 'completed' },
  { label: 'Pending',     value: 'pending' },
  { label: 'Cancelled',   value: 'cancelled' },
]

export default function ApiLogsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { openPanel } = usePanelContext()

  const before = searchParams.get('before') ?? ''
  const after  = searchParams.get('after')  ?? ''
  const method = searchParams.get('method') ?? ''
  const status = searchParams.get('status') ?? ''
  const search = searchParams.get('search') ?? ''

  // ⌘/ focus shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString())
    if (value) next.set(key, value); else next.delete(key)
    next.delete('before')
    next.delete('after')
    router.push(`?${next.toString()}`)
  }

  function clearFilters() {
    const next = new URLSearchParams()
    if (search) next.set('search', search)
    router.push(`?${next.toString()}`)
  }

  function handlePageChange(dir: 'before' | 'after', cursorValue: string) {
    const next = new URLSearchParams(searchParams.toString())
    next.delete('before')
    next.delete('after')
    if (cursorValue) next.set(dir, cursorValue)
    router.push(`?${next.toString()}`)
  }

  const params: Record<string, any> = { limit: 20 }
  if (method) params.filter = `method|eq|${method}`
  if (status) params.filter = `status|eq|${status}`
  if (before) params.before = before
  if (after)  params.after  = after
  if (search) params.search = search

  const { data, isLoading, error, refetch } = useApiRequestsControllerGet(params as any)
  const logs: ApiHydratedApiRequest[] = (data?.data as any) ?? []
  const hasMore    = (data as any)?.metadata?.hasMore ?? false
  const hasPrevious = !!before

  const filtersActive = !!(method || status)

  const methodLabel = METHOD_OPTIONS.find((o) => o.value === method)?.label ?? ''
  const statusLabel = STATUS_OPTIONS.find((o) => o.value === status)?.label ?? ''

  const COLUMNS = [
    {
      header: 'Timestamp',
      render: (row: ApiHydratedApiRequest) => (
        <span className="text-sm text-content-secondary tabular-nums whitespace-nowrap">
          {formatDatetime(row.createdAt)}
        </span>
      ),
    },
    {
      header: 'Method',
      render: (row: ApiHydratedApiRequest) => <MethodChip method={row.method} />,
    },
    {
      header: 'Path',
      render: (row: ApiHydratedApiRequest) => (
        <span className="text-sm font-mono text-content-primary">{row.path}</span>
      ),
    },
    {
      header: 'Status',
      render: (row: ApiHydratedApiRequest) => <StatusChip status={row.status} />,
    },
    {
      header: 'API Version',
      render: (row: ApiHydratedApiRequest) => (
        <span className="text-xs font-mono text-content-tertiary bg-surface-secondary border border-border-primary-light px-2 py-0.5 rounded">
          {row.apiVersion ?? '—'}
        </span>
      ),
    },
    {
      header: 'Source',
      render: (row: ApiHydratedApiRequest) => {
        const src = row.source
        const parts = [src?.os?.name, src?.client?.name, src?.ipAddress].filter(Boolean)
        return (
          <span className="text-xs font-mono text-content-tertiary">
            {parts.join(' · ') || '—'}
          </span>
        )
      },
    },
  ]

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="API Logs"
        description="Inspect incoming API requests and their responses."
      />

      <div className="space-y-3">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-6">

          {/* Left: filter chips */}
          <div className="flex items-center gap-2">
            {/* Method filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {method ? (
                  <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-border-primary-main bg-surface-primary cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                    Method{' '}
                    <span className="text-content-tertiary">is</span>{' '}
                    {methodLabel}
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); updateParam('method', '') }}
                      className="ml-0.5 leading-none cursor-pointer"
                    >
                      <X width={8} height={8} />
                    </button>
                  </div>
                ) : (
                  <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-dashed border-border-primary-dark bg-surface-primary shadow-whisper cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                    Method
                  </div>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuLabel>Method</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={method} onValueChange={(v) => updateParam('method', v)}>
                  {METHOD_OPTIONS.map((opt) => (
                    <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {status ? (
                  <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-border-primary-main bg-surface-primary cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                    Status{' '}
                    <span className="text-content-tertiary">is</span>{' '}
                    {statusLabel}
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); updateParam('status', '') }}
                      className="ml-0.5 leading-none cursor-pointer"
                    >
                      <X width={8} height={8} />
                    </button>
                  </div>
                ) : (
                  <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-dashed border-border-primary-dark bg-surface-primary shadow-whisper cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                    Status
                  </div>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={status} onValueChange={(v) => updateParam('status', v)}>
                  {STATUS_OPTIONS.map((opt) => (
                    <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {filtersActive && (
              <button
                onClick={clearFilters}
                className="text-sm font-semibold text-action-primary-main cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Right: search */}
          <InputGroup className="w-[240px] h-8 shrink-0">
            <InputGroupAddon>
              <Search width={14} height={14} className="text-content-tertiary" />
            </InputGroupAddon>
            <InputGroupInput
              ref={searchInputRef}
              placeholder="Search by path or IP…"
              value={search}
              onChange={(e) => updateParam('search', (e.target as HTMLInputElement).value)}
            />
          </InputGroup>
        </div>

        <DataTable
          data={logs}
          columns={COLUMNS}
          isLoading={isLoading}
          error={error ? ((error as any)?.message ?? 'Failed to load API logs') : null}
          onRetry={refetch}
          onRowClick={(row) => openPanel('log', row.id)}
          pagination={{ hasMore, hasPrevious, onPageChange: handlePageChange }}
          emptyState={{
            title: 'No requests found',
            description: filtersActive
              ? 'No requests match your filters.'
              : 'API requests will appear here once they are made.',
            icon: <Terminal width={20} height={20} />,
          }}
          resourceName="requests"
          idField="id"
        />
      </div>
    </div>
  )
}

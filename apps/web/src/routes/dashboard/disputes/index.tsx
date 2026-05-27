'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from '@/lib/routing'
import {
  Button,
  InputGroup, InputGroupAddon, InputGroupInput,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/lib/pax'
import { Search, Download, ShieldAlert, Landmark, X } from 'lucide-react'
import { Delta } from '@/components/ui/Delta'
import { StatValue } from '@/components/ui/StatValue'
import { PeriodSelect, type Period } from '@/components/ui/PeriodSelect'
import { useDisputeControllerGetDispute, useDisputeControllerGetMetrics, getDisputeControllerGetCSVUrl } from '@/api/disputes/disputes'
import { API_BASE_URL, STORAGE_KEYS } from '@/lib/constants'
import { usePanelContext } from '@/context/PanelContext'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import { formatAmount, formatDatetime, getApiErrorMessage } from '@/lib/format'

function unSlugify(str: string | undefined) {
  if (!str) return '—'
  return str.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const STATUS_OPTIONS = [
  { label: 'All statuses', value: '' },
  { label: 'Resolved', value: 'status|eq|resolved' },
  { label: 'Under review', value: 'status|eq|under-review' },
  { label: 'New', value: 'status|eq|new' },
]

export default function DisputesPage() {
  const router = useRouter()
  const { openPanel, panelState } = usePanelContext()
  const panelOpen = panelState.type !== null

  const COLUMNS = [
    {
      header: 'Source',
      render: (d: any) => {
        const card = d.source?.card
        if (card) {
          return (
            <div className="flex items-center gap-2">
              <div className="w-8 h-5 rounded bg-action-secondary-light flex items-center justify-center text-[8px] font-bold text-action-secondary-dark uppercase">
                {card.network?.charAt(0) || 'C'}
              </div>
              <span className="text-sm font-mono text-content-primary">
                •••• {card.details?.last4 || '••••'}
              </span>
            </div>
          )
        }
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-5 rounded border border-border-primary-light bg-surface-secondary flex items-center justify-center">
              <Landmark width={10} height={10} className="text-content-tertiary" />
            </div>
            <span className="text-xs font-mono text-content-tertiary truncate max-w-30">
              {d.source?.id || '—'}
            </span>
          </div>
        )
      },
    },
    {
      header: 'Amount',
      className: 'text-right',
      render: (d: any) => (
        <span className="text-sm font-semibold tabular-nums text-content-primary">
          {formatAmount(d.amount, d.currency)}
        </span>
      ),
    },
    {
      header: 'Reference',
      className: panelOpen ? 'hidden' : '',
      render: (d: any) => (
        <span className="text-xs font-mono text-content-tertiary truncate block max-w-25">
          {d.source?.networkData?.reference || '—'}
        </span>
      ),
    },
    {
      header: 'Reason',
      render: (d: any) => (
        <span className="text-sm text-content-secondary">{unSlugify(d.reason)}</span>
      ),
    },
    {
      header: 'Date',
      className: 'text-right hidden md:table-cell',
      render: (d: any) => (
        <span className="text-sm text-content-secondary max-w-[200px] truncate block">{formatDatetime(d.createdAt)}</span>
      ),
    },
    {
      header: 'Status',
      render: (d: any) => <Badge variant="status" value={d.status} />,
    },
  ]
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState(new Set<string>())
  const [period, setPeriod] = useState<Period>('7d')
  const [exportingCsv, setExportingCsv] = useState(false)

  const handleExport = async () => {
    setExportingCsv(true)
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const mode = localStorage.getItem(STORAGE_KEYS.DASHBOARD_MODE) ?? 'live'
      const exportFilter = selectedIds.size > 0
        ? `id|in|${Array.from(selectedIds).join(',')}`
        : filter
      const url = getDisputeControllerGetCSVUrl(
        exportFilter ? { filter: exportFilter } as any : undefined
      )
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-dashboard-mode': mode,
        },
      })
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const csvUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = csvUrl
      link.download = `disputes-${new Date().toISOString().slice(0, 10)}.csv`
      setTimeout(() => {
        link.click()
        window.URL.revokeObjectURL(csvUrl)
      }, 100)
    } finally {
      setExportingCsv(false)
    }
  }

  const before = searchParams?.get('before') || ''
  const after = searchParams?.get('after') || ''
  const filter = searchParams?.get('filter') || ''
  const search = searchParams?.get('search') || ''

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

  const updateParam = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    if (val) params.set(key, val)
    else params.delete(key)
    params.delete('before')
    params.delete('after')
    router.push(`/dashboard/disputes?${params.toString()}`)
  }

  const handlePageChange = (type: 'before' | 'after', cursorValue: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('before')
    params.delete('after')
    if (cursorValue) params.set(type, cursorValue)
    router.push(`/dashboard/disputes?${params.toString()}`)
  }

  const { data, isLoading, error, refetch } = useDisputeControllerGetDispute({
    limit: 20,
    expand: 'source source.card' as any,
    ...(before ? { before } : {}),
    ...(after ? { after } : {}),
    ...(filter ? { filter } : {}),
    ...(search ? { search } : {}),
  } as any)

  const { data: metricsRaw } = useDisputeControllerGetMetrics({ period })
  const metrics = metricsRaw as any

  const disputes = (data?.data as any) || []
  const hasMore = (data as any)?.metadata?.hasMore ?? false
  const hasPrevious = !!before

  const activeFilterCount = [filter].filter(Boolean).length
  const statusLabel = STATUS_OPTIONS.find((o) => o.value === filter)?.label ?? ''

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold text-content-primary leading-snug">Disputes</h1>
        <p className="text-sm text-content-tertiary mt-1">
          {!isLoading && (data as any)?.metadata?.totalCount > 0
            ? `${(data as any).metadata.totalCount.toLocaleString()} disputes`
            : 'Manage card and payment disputes.'}
        </p>
      </div>

      {/* Stats */}
      <div className="bg-surface-primary border border-border-primary-light rounded-xl px-5 py-4 flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
        <StatValue
          label="Open disputes"
          value={(metrics?.openDisputes?.count ?? 0).toLocaleString()}
          delta={metrics?.openDisputes?.thisWeek != null
            ? <Delta value={metrics.openDisputes.thisWeek} positiveIsGood={false} unit="" context="this week" />
            : undefined}
        />
        <div className="h-px md:h-auto md:w-px bg-border-primary-light flex-shrink-0" />
        <StatValue
          label="Dispute rate"
          value={`${metrics?.disputeRate?.rate ?? 0}%`}
          delta={metrics?.disputeRate?.change != null
            ? <Delta value={metrics.disputeRate.change} positiveIsGood={false} context="vs last period" />
            : undefined}
        />
        <div className="h-px md:h-auto md:w-px bg-border-primary-light flex-shrink-0" />
        <StatValue
          label="Dispute success rate"
          value={`${metrics?.successRate?.rate ?? 0}%`}
          delta={metrics?.successRate?.change != null
            ? <Delta value={metrics.successRate.change} context="vs last period" />
            : undefined}
        />
        <div className="shrink-0 self-start ml-auto">
          <PeriodSelect value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* Toolbar + Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-6">

          {/* Left: filter chips */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {filter ? (
                  <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-border-primary-main bg-surface-primary cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                    Status{' '}
                    <span className="text-content-tertiary">is</span>{' '}
                    {statusLabel}
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); updateParam('filter', '') }}
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
                <DropdownMenuRadioGroup value={filter} onValueChange={(v) => updateParam('filter', v)}>
                  {STATUS_OPTIONS.map((opt) => (
                    <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {activeFilterCount > 0 && (
              <button
                onClick={() => updateParam('filter', '')}
                className="text-sm font-semibold text-action-primary-main cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Right: search + export */}
          <div className="flex items-center gap-2">
            <InputGroup className="w-[240px] h-8 shrink-0">
              <InputGroupAddon>
                <Search width={14} height={14} className="text-content-tertiary" />
              </InputGroupAddon>
              <InputGroupInput
                ref={searchInputRef}
                placeholder="Search by ID, reference, or reason…"
                value={search}
                onChange={(e) => updateParam('search', e.target.value)}
              />
            </InputGroup>

            <Button variant="outline" color="secondary" size="sm" className="h-8 px-3 gap-1.5 cursor-pointer" onClick={handleExport} disabled={exportingCsv}>
              <Download width={14} height={14} /> {exportingCsv ? 'Exporting…' : 'Export'}
            </Button>
          </div>
        </div>

        <DataTable
          data={disputes}
          columns={COLUMNS}
          isLoading={isLoading}
          error={error ? getApiErrorMessage(error) : null}
          onRetry={refetch}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={(row) => openPanel('dispute', row.id)}
          pagination={{ hasMore, hasPrevious, onPageChange: handlePageChange }}
          emptyState={{
            icon: <ShieldAlert width={20} height={20} />,
            title: 'No disputes found',
            description: filter
              ? 'No disputes match the selected status.'
              : 'Disputes will appear here once they are raised on a transaction or payment.',
          }}
          resourceName="disputes"
          idField="id"
        />
      </div>
    </div>
  )
}

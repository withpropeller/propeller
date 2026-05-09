'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Button,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/lib/pax'
import { Search, ShieldCheck, Download, X, Ticket, Aperture, Glasses } from 'lucide-react'
import { useCardAuthorizationControllerGet, getCardAuthorizationControllerGetCSVUrl } from '@/api/card-authorizations/card-authorizations'
import { usePanelContext } from '@/context/PanelContext'
import { API_BASE_URL, STORAGE_KEYS } from '@/lib/constants'
import { Badge } from '@/components/ui/Badge'
import { NetworkBadge } from '@/components/ui/NetworkBadge'
import { DataTable } from '@/components/ui/DataTable'
import { formatAmount, formatDatetime, getApiErrorMessage } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Approved', value: 'status|eq|approved' },
  { label: 'Declined', value: 'status|eq|declined' },
  { label: 'Pending', value: 'status|eq|pending' },
  { label: 'Reversed', value: 'status|eq|reversed' },
]

const TYPE_OPTIONS = [
  { label: 'Pre-auth', value: 'pre_auth' },
  { label: 'Capture', value: 'capture' },
  { label: 'Reversal', value: 'reversal' },
]

const CHANNEL_OPTIONS = [
  { label: 'ATM', value: 'atm' },
  { label: 'POS', value: 'pos' },
  { label: 'Online', value: 'online' },
]

const TYPE_LABELS: Record<string, string> = Object.fromEntries(TYPE_OPTIONS.map((o) => [o.value, o.label]))
const CHANNEL_LABELS: Record<string, string> = Object.fromEntries(CHANNEL_OPTIONS.map((o) => [o.value, o.label]))

export default function AuthorizationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState(new Set<string>())
  const { panelState } = usePanelContext()
  const panelOpen = panelState.type !== null
  const [searchInput, setSearchInput] = useState(searchParams?.get('search') || '')
  const [exportingCsv, setExportingCsv] = useState(false)

  const before = searchParams?.get('before') || ''
  const after = searchParams?.get('after') || ''
  const filter = searchParams?.get('filter') || ''
  const typeFilter = searchParams?.get('type') || ''
  const channelFilter = searchParams?.get('channel') || ''

  const updateParam = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    if (val) params.set(key, val)
    else params.delete(key)
    params.delete('before')
    params.delete('after')
    router.push(`/dashboard/issuing/authorizations?${params.toString()}`)
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('filter')
    params.delete('type')
    params.delete('channel')
    params.delete('before')
    params.delete('after')
    router.push(`/dashboard/issuing/authorizations?${params.toString()}`)
  }

  const handlePageChange = (type: 'before' | 'after', cursorValue: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('before')
    params.delete('after')
    if (cursorValue) params.set(type, cursorValue)
    router.push(`/dashboard/issuing/authorizations?${params.toString()}`)
  }

  const filterParts = [
    filter,
    typeFilter ? `type|eq|${typeFilter}` : '',
    channelFilter ? `channel|eq|${channelFilter}` : '',
  ].filter(Boolean)

  const handleExport = async () => {
    setExportingCsv(true)
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const mode = localStorage.getItem(STORAGE_KEYS.DASHBOARD_MODE) ?? 'live'
      // If rows are selected, export only those. Otherwise honor current filters.
      const exportFilter = selectedIds.size > 0
        ? `id|in|${Array.from(selectedIds).join(',')}`
        : filterParts.join(',')
      const url = getCardAuthorizationControllerGetCSVUrl(
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
      link.download = `card-authorizations-${new Date().toISOString().slice(0, 10)}.csv`
      setTimeout(() => {
        link.click()
        window.URL.revokeObjectURL(csvUrl)
      }, 100)
    } finally {
      setExportingCsv(false)
    }
  }

  const { data, isLoading, error, refetch } = useCardAuthorizationControllerGet({
    limit: 10,
    expand: 'card' as any,
    ...(before ? { before } : {}),
    ...(after ? { after } : {}),
    ...(filterParts.length ? { filter: filterParts.join(',') } : {}),
    ...(searchInput.trim() ? { search: searchInput.trim() } : {}),
  } as any)

  const auths = (data?.data as any) || []
  const hasMore = (data as any)?.metadata?.hasMore ?? false
  const hasPrevious = !!before

  const activeFilterCount = [filter, typeFilter, channelFilter].filter(Boolean).length
  const statusLabel = STATUS_OPTIONS.find((o) => o.value === filter)?.label ?? ''

  const columns = [
    {
      header: 'Card',
      render: (auth: any) => (
        <div className="flex items-center gap-3">
          <NetworkBadge value={auth.card?.network ?? auth.card?.program?.network} />
          <div>
            <div className="text-sm font-semibold text-content-primary">
              •••• {auth.card?.details?.last4 || '••••'}
            </div>
            <div className="text-xs text-content-tertiary">
              Exp {auth.card?.details?.expiry || '—'}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Amount',
      render: (auth: any) => {
        const isZero = !auth.amount || auth.amount === 0
        return (
          <div className={[
            'text-sm font-medium tabular-nums',
            isZero
              ? 'text-content-tertiary'
              : auth.type === 'capture'
              ? 'text-feedback-danger-main'
              : 'text-content-primary',
          ].join(' ')}>
            {formatAmount(auth.amount, auth.currency)}
          </div>
        )
      },
    },
    {
      header: 'Type',
      render: (auth: any) => {
        const type = auth.type?.toLowerCase()
        if (type === 'capture') {
          return (
            <span className="inline-flex items-center gap-1 rounded-md border border-border-primary-main bg-surface-primary px-2 py-1 text-xs font-medium text-content-primary shadow-whisper">
              <Aperture width={12} height={12} className="text-content-secondary" />
              Capture
            </span>
          )
        }
        if (type === 'check') {
          return (
            <span className="inline-flex items-center gap-1 rounded-md border border-border-primary-main bg-surface-primary px-2 py-1 text-xs font-medium text-content-primary shadow-whisper">
              <Glasses width={12} height={12} className="text-content-secondary" />
              Check
            </span>
          )
        }
        return <Badge variant="type" value={auth.type?.replace(/_/g, ' ') || '—'} />
      },
    },
    {
      header: 'Channel',
      className: panelOpen ? 'hidden' : '',
      render: (auth: any) => (
        <div className="text-sm text-content-secondary">
          {auth.channel?.toUpperCase() || '—'}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (auth: any) => (
        <Badge variant="status" value={auth.status} />
      ),
    },
    {
      header: 'Date',
      className: 'hidden md:table-cell',
      render: (auth: any) => (
        <div className="text-sm text-content-tertiary tabular-nums">
          {formatDatetime(auth.createdAt)}
        </div>
      ),
    },
    {
      header: '',
      width: '44px',
      render: (auth: any) =>
        auth.dispute ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="inline-flex items-center justify-center shrink-0 rounded-md border border-[#f9dbaf] bg-[#fef6ee] p-[5px]"
                onClick={(e) => e.stopPropagation()}
              >
                <Ticket width={12} height={12} className="text-[#b93815]" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              This authorization is currently in dispute
            </TooltipContent>
          </Tooltip>
        ) : null,
    },
  ]

  return (
    <TooltipProvider>
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Authorizations"
        description="Review and respond to card authorization requests."
      />

      <div className="space-y-4">

      {/* Filter bar */}
      <div className="flex items-center justify-between gap-6">

        {/* Left: filter chips */}
        <div className="flex items-center gap-2">

          {/* Status */}
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

          {/* Type */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {typeFilter ? (
                <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-border-primary-main bg-surface-primary cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  Type{' '}
                  <span className="text-content-tertiary">is</span>{' '}
                  {TYPE_LABELS[typeFilter] ?? typeFilter}
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
                  Type
                </div>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel>Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={typeFilter} onValueChange={(v) => updateParam('type', v)}>
                {TYPE_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Channel */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {channelFilter ? (
                <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-border-primary-main bg-surface-primary cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  Channel{' '}
                  <span className="text-content-tertiary">is</span>{' '}
                  {CHANNEL_LABELS[channelFilter] ?? channelFilter}
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); updateParam('channel', '') }}
                    className="ml-0.5 leading-none cursor-pointer"
                  >
                    <X width={8} height={8} />
                  </button>
                </div>
              ) : (
                <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-dashed border-border-primary-dark bg-surface-primary shadow-whisper cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  Channel
                </div>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel>Channel</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={channelFilter} onValueChange={(v) => updateParam('channel', v)}>
                {CHANNEL_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add filter — commented out until additional filter types are needed
          <div className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-dashed border-border-primary-dark bg-surface-primary shadow-whisper cursor-pointer select-none">
            <Plus width={12} height={12} />
            Add filter
          </div>
          */}

          {activeFilterCount > 0 && (
            <button
              className="text-sm font-semibold text-action-primary-main cursor-pointer"
              onClick={clearAllFilters}
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
              placeholder="Search authorizations..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                updateParam('search', e.target.value)
              }}
            />
          </InputGroup>

          <Button
            variant="outline"
            color="secondary"
            size="sm"
            className="h-8 px-3 gap-1.5 cursor-pointer"
            onClick={handleExport}
            disabled={exportingCsv}
          >
            <Download width={14} height={14} />
            {exportingCsv
              ? 'Exporting…'
              : selectedIds.size > 0
                ? `Export ${selectedIds.size} selection${selectedIds.size === 1 ? '' : 's'}`
                : 'Export'}
          </Button>
        </div>
      </div>

      <DataTable
        data={auths}
        columns={columns}
        isLoading={isLoading}
        error={error ? getApiErrorMessage(error) : null}
        onRetry={refetch}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(row) => router.push(`/dashboard/issuing/authorizations/${row.id}`)}
        pagination={{ hasMore, hasPrevious, onPageChange: handlePageChange }}
        emptyState={{
          title: 'No authorizations found',
          description: activeFilterCount > 0
            ? 'No authorizations match the selected filters.'
            : 'Authorization attempts will appear here when they occur.',
          icon: <ShieldCheck width={24} height={24} />,
        }}
        resourceName="authorizations"
      />
      </div>
    </div>
    </TooltipProvider>
  )
}

'use client'

import { useState, useEffect } from 'react'
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
} from '@/lib/pax'
import { Search, Download, X, ArrowLeftRight } from 'lucide-react'
import { useCardTransactionControllerGet, getCardTransactionControllerGetCSVUrl } from '@/api/card-transactions/card-transactions'
import { usePanelContext } from '@/context/PanelContext'
import { API_BASE_URL, STORAGE_KEYS } from '@/lib/constants'
import { Badge } from '@/components/ui/Badge'
import { NetworkBadge } from '@/components/ui/NetworkBadge'
import { DataTable } from '@/components/ui/DataTable'
import { formatDatetime, formatAmount, getApiErrorMessage } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'

const CHANNEL_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'ATM', value: 'atm' },
  { label: 'POS', value: 'pos' },
  { label: 'Online', value: 'online' },
]

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Approved', value: 'approved' },
  { label: 'Declined', value: 'declined' },
  { label: 'Pending', value: 'pending' },
  { label: 'Reversed', value: 'reversed' },
]

const CHANNEL_LABELS: Record<string, string> = Object.fromEntries(CHANNEL_OPTIONS.filter(o => o.value).map((o) => [o.value, o.label]))
const STATUS_LABELS: Record<string, string> = Object.fromEntries(STATUS_OPTIONS.filter(o => o.value).map((o) => [o.value, o.label]))

export default function TransactionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState(new Set<string>())
  const { panelState, openPanel } = usePanelContext()
  const panelOpen = panelState.type !== null
  const [searchInput, setSearchInput] = useState(searchParams?.get('search') || '')
  const [exportingCsv, setExportingCsv] = useState(false)

  const before = searchParams?.get('before') || ''
  const after = searchParams?.get('after') || ''
  const channel = searchParams?.get('channel') || ''
  const status = searchParams?.get('status') || ''
  const panelId = searchParams?.get('id') || ''

  useEffect(() => {
    if (panelId) {
      openPanel('transaction', panelId)
    }
  }, [panelId, openPanel])

  const updateParam = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    if (val) params.set(key, val)
    else params.delete(key)
    params.delete('before')
    params.delete('after')
    router.push(`/dashboard/issuing/transactions?${params.toString()}`)
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('channel')
    params.delete('status')
    params.delete('before')
    params.delete('after')
    router.push(`/dashboard/issuing/transactions?${params.toString()}`)
  }

  const handleExport = async () => {
    setExportingCsv(true)
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const mode = localStorage.getItem(STORAGE_KEYS.DASHBOARD_MODE) ?? 'live'
      // If rows are selected, export only those. Otherwise honor current filters.
      const exportFilter = selectedIds.size > 0
        ? `id|in|${Array.from(selectedIds).join(',')}`
        : filterParts.join(',')
      const url = getCardTransactionControllerGetCSVUrl(
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
      link.download = `card-transactions-${new Date().toISOString().slice(0, 10)}.csv`
      setTimeout(() => {
        link.click()
        window.URL.revokeObjectURL(csvUrl)
      }, 100)
    } finally {
      setExportingCsv(false)
    }
  }

  const handlePageChange = (type: 'before' | 'after', cursorValue: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('before')
    params.delete('after')
    if (cursorValue) params.set(type, cursorValue)
    router.push(`/dashboard/issuing/transactions?${params.toString()}`)
  }

  const filterParts = [
    channel ? `channel|eq|${channel}` : '',
    status ? `status|eq|${status}` : '',
  ].filter(Boolean)

  const { data, isLoading, error, refetch } = useCardTransactionControllerGet({
    limit: 10,
    expand: 'card.details authorization.dispute authorization.status' as any,
    ...(before ? { before } : {}),
    ...(after ? { after } : {}),
    ...(filterParts.length ? { filter: filterParts.join(',') } : {}),
    ...(searchInput.trim() ? { search: searchInput.trim() } : {}),
  } as any)

  const transactions = (data?.data as any) || []
  const hasMore = (data as any)?.metadata?.hasMore ?? false
  const hasPrevious = !!before

  const activeFilterCount = [channel, status].filter(Boolean).length

  const isDebit = (txn: any) =>
    ['debit', 'withdrawal', 'fee'].includes(txn.type?.toLowerCase())

  const columns = [
    {
      header: 'Amount',
      render: (txn: any) => {
        const debit = isDebit(txn)
        return (
          <div className={[
            'text-sm font-semibold tabular-nums',
            debit ? 'text-feedback-error-main' : 'text-feedback-success-main',
          ].join(' ')}>
            {debit ? '-' : '+'}
            {formatAmount(txn.amount, txn.currency)}
          </div>
        )
      },
    },
    {
      header: 'Status',
      render: (txn: any) => (
        <div className="flex items-center gap-1.5">
          <Badge variant="status" value={txn.authorization?.status} />
        </div>
      ),
    },
    {
      header: 'Card',
      render: (txn: any) => (
        <div className="flex items-center gap-3">
          <NetworkBadge
            value={txn.card?.network || (txn.id?.includes('mcr') ? 'mastercard' : 'visa')}
          />
          <div>
            <div className="text-sm font-semibold text-content-primary">
              •••• {txn.card?.details?.last4 || '••••'}
            </div>
            <div className="text-xs text-content-tertiary">
              Exp {txn.card?.details?.expiry || '—'}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Channel',
      render: (txn: any) => (
        <div className="text-sm text-content-secondary">
          {txn.channel?.toUpperCase() || '—'}
        </div>
      ),
    },
    {
      header: 'RRN',
      className: panelOpen ? 'hidden' : '',
      render: (txn: any) => (
        <div className="text-sm text-content-tertiary font-mono tracking-tight">
          {txn.networkData?.rrn || '—'}
        </div>
      ),
    },
    {
      header: 'Reference',
      className: panelOpen ? 'hidden' : '',
      render: (txn: any) => (
        <div className="text-sm text-content-tertiary font-mono tracking-tight truncate max-w-48">
          {txn.networkData?.reference || txn.id}
        </div>
      ),
    },
    {
      header: 'Date',
      className: 'hidden md:table-cell',
      render: (txn: any) => (
        <div className="text-sm text-content-tertiary tabular-nums">
          {formatDatetime(txn.createdAt)}
        </div>
      ),
    },
  ]

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Transactions"
        description="All card transactions across your issued cards."
      />

      <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center justify-between gap-6">

        {/* Left: filter chips */}
        <div className="flex items-center gap-2">

          {/* Channel */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {channel ? (
                <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-border-primary-main bg-surface-primary cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  Channel{' '}
                  <span className="text-content-tertiary">is</span>{' '}
                  {CHANNEL_LABELS[channel] ?? channel}
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
              <DropdownMenuRadioGroup value={channel} onValueChange={(v) => updateParam('channel', v)}>
                {CHANNEL_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {status ? (
                <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-border-primary-main bg-surface-primary cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  Status{' '}
                  <span className="text-content-tertiary">is</span>{' '}
                  {STATUS_LABELS[status] ?? status}
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
              placeholder="Search transactions..."
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
        data={transactions}
        columns={columns}
        isLoading={isLoading}
        error={error ? getApiErrorMessage(error) : null}
        onRetry={refetch}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(row) => openPanel('transaction', row.id)}
        pagination={{ hasMore, hasPrevious, onPageChange: handlePageChange }}
        emptyState={{
          title: 'No transactions',
          description: activeFilterCount > 0
            ? 'No transactions match the selected filters.'
            : 'Card transactions will appear here once activity is recorded.',
          icon: <ArrowLeftRight width={20} height={20} />,
        }}
        resourceName="transactions"
      />
      </div>
    </div>
  )
}

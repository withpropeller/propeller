'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from '@/lib/routing'
import {
  Button,
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
import { Search, ArrowUpRight, ArrowDownLeft, CreditCard, Landmark, Banknote, Settings2, Download, X } from 'lucide-react'
import { usePaymentControllerGetAll, getPaymentControllerGetCSVUrl } from '@/api/payments/payments'
import { API_BASE_URL, STORAGE_KEYS } from '@/lib/constants'
import { usePanelContext } from '@/context/PanelContext'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import { formatAmount, formatDatetime, getApiErrorMessage } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'
import { ConfigurePaymentsModal } from '@/components/ui/ConfigurePaymentsModal'

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Successful', value: 'status|eq|successful' },
  { label: 'Processing', value: 'status|eq|processing' },
  { label: 'Failed', value: 'status|eq|failed' },
  { label: 'Reversed', value: 'status|eq|reversed' },
]


export default function PaymentsPage() {
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState(new Set<string>())
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [exportingCsv, setExportingCsv] = useState(false)

  const handleExport = async () => {
    setExportingCsv(true)
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const mode = localStorage.getItem(STORAGE_KEYS.DASHBOARD_MODE) ?? 'live'
      const exportFilter = selectedIds.size > 0
        ? `id|in|${Array.from(selectedIds).join(',')}`
        : filter
      const url = getPaymentControllerGetCSVUrl(
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
      link.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`
      setTimeout(() => {
        link.click()
        window.URL.revokeObjectURL(csvUrl)
      }, 100)
    } finally {
      setExportingCsv(false)
    }
  }
  const { openPanel, panelState } = usePanelContext()
  const panelOpen = panelState.type !== null

  const before = searchParams?.get('before') || ''
  const after = searchParams?.get('after') || ''
  const filter = searchParams?.get('filter') || ''
  const search = searchParams?.get('search') || ''
  const panelId = searchParams?.get('id') || ''

  // Open panel when id is present in URL
  useEffect(() => {
    if (panelId) {
      openPanel('payment', panelId)
    }
  }, [panelId, openPanel])

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
    router.push(`/dashboard/payments?${params.toString()}`)
  }

  const handlePageChange = (type: 'before' | 'after', cursorValue: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('before')
    params.delete('after')
    if (cursorValue) params.set(type, cursorValue)
    router.push(`/dashboard/payments?${params.toString()}`)
  }

  const { data, isLoading, error, refetch } = usePaymentControllerGetAll({
    limit: 20,
    expand: 'account dispute' as any,
    sort: 'createdAt_desc' as any,
    ...(before ? { before } : {}),
    ...(after ? { after } : {}),
    ...(filter ? { filter } : {}),
    ...(search ? { search } : {}),
  } as any)

  const payments = (data?.data as any) || []
  const hasMore = (data as any)?.metadata?.hasMore ?? false
  const hasPrevious = !!before

  const activeFilterCount = [filter].filter(Boolean).length
  const statusLabel = STATUS_OPTIONS.find((o) => o.value === filter)?.label ?? ''

  const isDebit = (p: any) => ['payout', 'debit'].includes(p.type?.toLowerCase())
  const toSentenceCase = (s: string) => {
    const spaced = s.replace(/[-_]/g, ' ')
    return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase()
  }

  const columns = [
    {
      header: 'ID',
      render: (p: any) => (
        <div className="min-w-0">
          <div className="text-xs font-mono text-content-primary truncate max-w-35">{p.id}</div>
          {p.sessionId && (
            <div className="text-[10px] font-mono text-content-tertiary truncate max-w-35 mt-0.5">{p.sessionId}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Amount',
      className: 'text-right',
      render: (p: any) => (
        <div className="text-right">
          <div className="text-sm font-semibold tabular-nums text-content-primary">
            {formatAmount(p.amount, p.currency)}
          </div>
          {p.fee != null && p.fee > 0 && (
            <div className="text-[10px] text-content-tertiary tabular-nums mt-0.5">
              Fee: {formatAmount(p.fee, p.currency)}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Type',
      render: (p: any) => (
        <Chip variant="status" className="gap-1.5">
          {isDebit(p) ? <ArrowUpRight width={11} height={11} /> : <ArrowDownLeft width={11} height={11} />}
          <span>{p.type ? toSentenceCase(p.type) : '—'}</span>
        </Chip>
      ),
    },
    {
      header: 'Method',
      className: panelOpen ? 'hidden' : '',
      render: (p: any) => (
        <Chip variant="status" className="gap-1.5">
          {p.method === 'card'
            ? <CreditCard width={11} height={11} />
            : p.method === 'bank_transfer' || p.method === 'bank-transfer'
              ? <Landmark width={11} height={11} />
              : <Banknote width={11} height={11} />}
          <span>{p.method ? toSentenceCase(p.method) : '—'}</span>
        </Chip>
      ),
    },
    { header: 'Status', render: (p: any) => <Badge variant="status" value={p.status} /> },
    {
      header: 'Date',
      className: 'text-right hidden md:table-cell',
      render: (p: any) => (
        <div className="text-sm text-content-tertiary tabular-nums text-right">
          {formatDatetime(p.createdAt)}
        </div>
      ),
    },
  ]

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Payments"
        description="All incoming and outgoing payments across your accounts."
        
      />

      <div className="space-y-3">
      {/* Toolbar */}
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

        {/* Right: search + actions */}
        <div className="flex items-center gap-2">
          <InputGroup className="w-[240px] h-8 shrink-0">
            <InputGroupAddon>
              <Search width={14} height={14} className="text-content-tertiary" />
            </InputGroupAddon>
            <InputGroupInput
              ref={searchInputRef}
              placeholder="Search by ID, session ID, or reference…"
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
        data={payments}
        columns={columns}
        isLoading={isLoading}
        error={error ? getApiErrorMessage(error) : null}
        onRetry={refetch}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(row) => openPanel('payment', row.id)}
        pagination={{ hasMore, hasPrevious, onPageChange: handlePageChange }}
        emptyState={{
          title: 'No payments found',
          description: filter
            ? 'No payments match the selected filter.'
            : 'Your transaction history will appear here once payments start flowing.',
          icon: <ArrowUpRight width={20} height={20} />,
        }}
        resourceName="payments"
      />
      </div>

      {showConfigModal && <ConfigurePaymentsModal onClose={() => setShowConfigModal(false)} />}
    </div>
  )
}

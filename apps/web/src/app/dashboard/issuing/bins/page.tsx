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
} from '@/lib/pax'
import { Search, Download, X, Database } from 'lucide-react'
import { useCardBinControllerGetAll } from '@/api/card-bins/card-bins'
import { usePanelContext } from '@/context/PanelContext'
import { Badge } from '@/components/ui/Badge'
import { NetworkBadge } from '@/components/ui/NetworkBadge'
import { DataTable } from '@/components/ui/DataTable'
import { formatDatetime, getApiErrorMessage } from '@/lib/format'
import { PageHeader } from '@/components/ui/PageHeader'

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'New', value: 'new' },
  { label: 'Under review', value: 'under-review' },
  { label: 'Approval requested', value: 'approval-requested' },
  { label: 'Approved', value: 'approved' },
  { label: 'Live', value: 'live' },
  { label: 'Suspended', value: 'suspended' },
]

const NETWORK_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Mastercard', value: 'mastercard' },
  { label: 'Verve', value: 'verve' },
  { label: 'Visa', value: 'visa' },
]

const STATUS_LABELS: Record<string, string> = Object.fromEntries(STATUS_OPTIONS.filter(o => o.value).map((o) => [o.value, o.label]))
const NETWORK_LABELS: Record<string, string> = Object.fromEntries(NETWORK_OPTIONS.map((o) => [o.value, o.label]))

export default function BinsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState(new Set<string>())
  const { panelState } = usePanelContext()
  const panelOpen = panelState.type !== null
  const [searchInput, setSearchInput] = useState(searchParams?.get('search') || '')

  const before = searchParams?.get('before') || ''
  const after = searchParams?.get('after') || ''
  const status = searchParams?.get('status') || ''
  const network = searchParams?.get('network') || ''

  const updateParam = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    if (val) params.set(key, val)
    else params.delete(key)
    params.delete('before')
    params.delete('after')
    router.push(`/dashboard/issuing/bins?${params.toString()}`)
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('status')
    params.delete('network')
    params.delete('before')
    params.delete('after')
    router.push(`/dashboard/issuing/bins?${params.toString()}`)
  }

  const handlePageChange = (type: 'before' | 'after', cursorValue: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('before')
    params.delete('after')
    if (cursorValue) params.set(type, cursorValue)
    router.push(`/dashboard/issuing/bins?${params.toString()}`)
  }

  const filterParts = [
    network ? `network|eq|${network}` : '',
  ].filter(Boolean)

  const { data, isLoading, error, refetch } = useCardBinControllerGetAll({
    limit: 10,
    ...(before ? { before } : {}),
    ...(after ? { after } : {}),
    ...(status ? { status } : {}),
    ...(filterParts.length ? { filter: filterParts.join(',') } : {}),
    ...(searchInput.trim() ? { search: searchInput.trim() } : {}),
  } as any)

  const bins = (data?.data as any) || []
  const hasMore = (data as any)?.metadata?.hasMore ?? false
  const hasPrevious = !!before

  const activeFilterCount = [status, network].filter(Boolean).length

  const columns = [
    {
      header: 'BIN name',
      render: (bin: any) => (
        <div>
          <div className="text-sm font-semibold text-content-primary">
            {bin.name || <span className="text-content-tertiary font-normal">No name</span>}
          </div>
          <div className="text-xs text-content-tertiary mt-0.5 font-mono">
            {bin.id}
          </div>
        </div>
      ),
    },
    {
      header: 'Network',
      render: (bin: any) => <NetworkBadge value={bin.network} />,
    },
    {
      header: 'Type',
      render: (bin: any) => <Badge variant="type" value={bin.type || '—'} />,
    },
    {
      header: 'BIN length',
      className: panelOpen ? 'hidden' : '',
      render: (bin: any) => (
        <div className="text-sm font-mono text-content-primary tabular-nums">{bin.binLength || '—'}</div>
      ),
    },
    { header: 'Status', render: (bin: any) => <Badge variant="status" value={bin.status} /> },
    {
      header: 'Date & time',
      className: panelOpen ? 'hidden' : 'hidden md:table-cell',
      render: (bin: any) => (
        <span className="text-sm text-content-secondary max-w-[200px] truncate block">{formatDatetime(bin.createdAt)}</span>
      ),
    },
  ]

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="BINs"
        description="View the Bank Identification Numbers assigned to your programs."
      />

      <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center justify-between gap-6">

        {/* Left: filter chips */}
        <div className="flex items-center gap-2">

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

          {/* Network */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {network ? (
                <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-border-primary-main bg-surface-primary cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  Network{' '}
                  <span className="text-content-tertiary">is</span>{' '}
                  {NETWORK_LABELS[network] ?? network}
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); updateParam('network', '') }}
                    className="ml-0.5 leading-none cursor-pointer"
                  >
                    <X width={8} height={8} />
                  </button>
                </div>
              ) : (
                <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-dashed border-border-primary-dark bg-surface-primary shadow-whisper cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  Network
                </div>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel>Network</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={network} onValueChange={(v) => updateParam('network', v)}>
                {NETWORK_OPTIONS.map((opt) => (
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
              placeholder="Search BINs..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                updateParam('search', e.target.value)
              }}
            />
          </InputGroup>

         
        </div>
      </div>

      <DataTable
        data={bins}
        columns={columns}
        isLoading={isLoading}
        error={error ? getApiErrorMessage(error) : null}
        onRetry={refetch}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(row) => router.push(`/dashboard/issuing/bins/${row.id}`)}
        pagination={{ hasMore, hasPrevious, onPageChange: handlePageChange }}
        emptyState={{
          title: 'No BINs found',
          description: activeFilterCount > 0
            ? 'No BINs match the selected filters.'
            : 'BIN ranges assigned to your account will appear here.',
          icon: <Database width={20} height={20} />,
        }}
        resourceName="BINs"
      />
      </div>
    </div>
  )
}

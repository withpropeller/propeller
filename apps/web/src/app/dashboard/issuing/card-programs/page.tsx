'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PermissionGate } from '@/components/PermissionGate'
import { Permission } from '@/lib/permissions'
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
import { Search, X, LayoutGrid, Download, Plus } from 'lucide-react'
import { useCardProgramControllerGetCardPrograms } from '@/api/card-programs/card-programs'
import { usePanelContext } from '@/context/PanelContext'
import { NetworkBadge } from '@/components/ui/NetworkBadge'
import { Badge } from '@/components/ui/Badge'
import { Currency } from '@/components/ui/Currency'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { getApiErrorMessage } from '@/lib/format'

interface FilterOption { label: string; value: string }

const STATUS_OPTIONS: FilterOption[] = [
  { label: 'All', value: '' },
  { label: 'Live', value: 'live' },
  { label: 'Pending Approval', value: 'pending-approval' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Inactive', value: 'inactive' },
]

const NETWORK_OPTIONS: FilterOption[] = [
  { label: 'All', value: '' },
  { label: 'Mastercard', value: 'mastercard' },
  { label: 'Verve', value: 'verve' },
  { label: 'Visa', value: 'visa' },
]

const TYPE_OPTIONS: FilterOption[] = [
  { label: 'All', value: '' },
  { label: 'Virtual', value: 'virtual' },
  { label: 'Physical', value: 'physical' },
]

const CURRENCY_OPTIONS: FilterOption[] = [
  { label: 'All', value: '' },
  { label: 'USD', value: 'usd' },
  { label: 'NGN', value: 'ngn' },
]

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label])
)
const NETWORK_LABELS: Record<string, string> = Object.fromEntries(
  NETWORK_OPTIONS.map((o) => [o.value, o.label])
)
const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  TYPE_OPTIONS.map((o) => [o.value, o.label])
)
const CURRENCY_LABELS: Record<string, string> = Object.fromEntries(
  CURRENCY_OPTIONS.map((o) => [o.value, o.label])
)


export default function CardProgramsPage() {
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState(new Set<string>())
  const [searchInput, setSearchInput] = useState(searchParams?.get('search') || '')
  const { panelState } = usePanelContext()
  const panelOpen = panelState.type !== null

  const before = searchParams?.get('before') || ''
  const after = searchParams?.get('after') || ''
  const status = searchParams?.get('status') || ''
  const network = searchParams?.get('network') || ''
  const type = searchParams?.get('type') || ''
  const currency = searchParams?.get('currency') || ''

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
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
    router.push(`/dashboard/issuing/card-programs?${params.toString()}`)
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('status')
    params.delete('network')
    params.delete('type')
    params.delete('currency')
    params.delete('before')
    params.delete('after')
    router.push(`/dashboard/issuing/card-programs?${params.toString()}`)
  }

  const handlePageChange = (type: 'before' | 'after', cursorValue: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('before')
    params.delete('after')
    if (cursorValue) params.set(type, cursorValue)
    router.push(`/dashboard/issuing/card-programs?${params.toString()}`)
  }

  // Build combined filter string for API
  const filterParts = [
    status ? `status|eq|${status}` : '',
    network ? `network|eq|${network}` : '',
    type ? `type|eq|${type}` : '',
    currency ? `currency|eq|${currency}` : '',
  ].filter(Boolean)

  const { data, isLoading, error, refetch } = useCardProgramControllerGetCardPrograms({
    limit: 10,
    expand: 'bin' as any,
    ...(before ? { before } : {}),
    ...(after ? { after } : {}),
    ...(filterParts.length ? { filter: filterParts.join(',') } : {}),
    ...(searchInput.trim() ? { search: searchInput.trim() } : {}),
  } as any)

  const programs = (data?.data as any) || []
  const hasMore = (data as any)?.metadata?.hasMore ?? false
  const hasPrevious = !!before

  const activeFilterCount = [status, network, type, currency].filter(Boolean).length

  const columns = [
    {
      header: 'Program name',
      render: (p: any) => (
        <div className="text-sm font-medium text-content-primary">{p.name || <span className="text-content-tertiary font-normal">No name</span>}</div>
      ),
    },
    {
      header: 'Quantity',
      render: (p: any) => (
        <div className="text-sm font-normal text-content-secondary tabular-nums">
          {p.quantity?.toLocaleString() || '—'}
        </div>
      ),
    },
    {
      header: 'Network',
      render: (p: any) => <NetworkBadge value={p.network} showLabel />,
    },
    {
      header: 'Type',
      render: (p: any) => <Badge variant="type" value={p.type} />,
    },
    {
      header: 'Currency',
      className: panelOpen ? 'hidden' : '',
      render: (p: any) => <Currency code={p.currency} />,
    },
    {
      header: 'Status',
      render: (p: any) => <Badge variant="status" value={p.status} />,
    },
  ]

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader
        title="Card programs"
        description="Manage your card programs and their configurations."
        action={
          <PermissionGate permission={Permission.CardProgramsCreate}>
            <Button variant="default" color="primary" size="sm" className="gap-2" onClick={() => router.push('/dashboard/issuing/card-programs/create')}>
              <Plus width={14} height={14} /> Create card program
            </Button>
          </PermissionGate>
        }
      />

      <div className="space-y-4">
      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-6">

        {/* Left: filter chips + Clear all */}
        <div className="flex items-center gap-2">

          {/* Status filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {status ? (
                <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-border-primary-main bg-surface-primary cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  Status{' '}
                  <span className="text-content-tertiary">is</span>{' '}
                  {STATUS_LABELS[status]}
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
              <DropdownMenuRadioGroup
                value={status}
                onValueChange={(v) => updateParam('status', v)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Network filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {network ? (
                <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-border-primary-main bg-surface-primary cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  Network{' '}
                  <span className="text-content-tertiary">is</span>{' '}
                  {NETWORK_LABELS[network]}
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
              <DropdownMenuRadioGroup
                value={network}
                onValueChange={(v) => updateParam('network', v)}
              >
                {NETWORK_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Type filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {type ? (
                <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-border-primary-main bg-surface-primary cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  Type{' '}
                  <span className="text-content-tertiary">is</span>{' '}
                  {TYPE_LABELS[type]}
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
              <DropdownMenuRadioGroup
                value={type}
                onValueChange={(v) => updateParam('type', v)}
              >
                {TYPE_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Currency filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {currency ? (
                <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-border-primary-main bg-surface-primary cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  Currency{' '}
                  <span className="text-content-tertiary">is</span>{' '}
                  {CURRENCY_LABELS[currency]}
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); updateParam('currency', '') }}
                    className="ml-0.5 leading-none cursor-pointer"
                  >
                    <X width={8} height={8} />
                  </button>
                </div>
              ) : (
                <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-dashed border-border-primary-dark bg-surface-primary shadow-whisper cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  Currency
                </div>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel>Currency</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={currency}
                onValueChange={(v) => updateParam('currency', v)}
              >
                {CURRENCY_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear all — only when at least one filter is active */}
          {(status || network || type || currency) && (
            <button
              className="text-sm font-semibold text-action-primary-main cursor-pointer"
              onClick={clearAllFilters}
            >
              Clear all
            </button>
          )}
        </div>

        {/* Right: search + Export */}
        <div className="flex items-center gap-2">
          <InputGroup className="w-[240px] h-8 shrink-0">
            <InputGroupAddon>
              <Search width={14} height={14} className="text-content-tertiary" />
            </InputGroupAddon>
            <InputGroupInput
              ref={searchInputRef}
              placeholder="Search for a card program…"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                updateParam('search', e.target.value)
              }}
            />
          </InputGroup>

          <Button variant="outline" color="secondary" size="sm" className="h-8 px-3 gap-1.5 cursor-pointer">
            <Download width={14} height={14} />
            {selectedIds.size > 0 ? `Export ${selectedIds.size} selection${selectedIds.size === 1 ? '' : 's'}` : 'Export'}
          </Button>
        </div>
      </div>

      <DataTable
        data={programs}
        columns={columns}
        isLoading={isLoading}
        error={error ? getApiErrorMessage(error) : null}
        onRetry={refetch}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(row) => router.push(`/dashboard/issuing/card-programs/${row.id}`)}
        pagination={{ hasMore, hasPrevious, onPageChange: handlePageChange }}
        emptyState={{
          title: 'No card programs yet',
          description: activeFilterCount > 0
            ? 'No programs match your filters. Try adjusting or clearing them.'
            : 'Create your first card program to start issuing cards.',
          icon: <LayoutGrid width={20} height={20} />,
        }}
        resourceName="programs"
      />
      </div>

    </div>
  )
}

'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Button, InputGroup, InputGroupAddon, InputGroupInput,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from '@/lib/pax'
import { Search, Download, X, CreditCard } from 'lucide-react'
import { Delta } from '@/components/ui/Delta'
import { StatValue } from '@/components/ui/StatValue'
import { PeriodSelect, type Period } from '@/components/ui/PeriodSelect'
import { useCardControllerGetCards, useCardControllerGetMetrics } from '@/api/cards/cards'
import { useCardAuthorizationControllerGetMetrics } from '@/api/card-authorizations/card-authorizations'
import { useCardProgramControllerGetCardPrograms } from '@/api/card-programs/card-programs'
import { usePanelContext } from '@/context/PanelContext'
import { Badge } from '@/components/ui/Badge'
import { NetworkBadge } from '@/components/ui/NetworkBadge'
import { DataTable } from '@/components/ui/DataTable'
import { Currency } from '@/components/ui/Currency'
import { PageHeader } from '@/components/ui/PageHeader'
import { getApiErrorMessage } from '@/lib/format'

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'status|eq|active' },
  { label: 'Blocked', value: 'status|eq|blocked' },
  { label: 'Inactive', value: 'status|eq|inactive' },
]

const TYPE_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Virtual', value: 'virtual' },
  { label: 'Physical', value: 'physical' },
]

const CURRENCY_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'USD', value: 'usd' },
  { label: 'NGN', value: 'ngn' },
]


const TYPE_LABELS: Record<string, string> = Object.fromEntries(TYPE_OPTIONS.map((o) => [o.value, o.label]))

const CURRENCY_LABELS: Record<string, string> = Object.fromEntries(CURRENCY_OPTIONS.map((o) => [o.value, o.label]))

export default function CardsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState(new Set<string>())
  const { panelState } = usePanelContext()
  const panelOpen = panelState.type !== null
  const [searchInput, setSearchInput] = useState(searchParams?.get('search') || '')
  const [period, setPeriod] = useState<Period>('7d')

  const before = searchParams?.get('before') || ''
  const after = searchParams?.get('after') || ''
  const filter = searchParams?.get('filter') || ''
  const programId = searchParams?.get('program') || ''
  const cardType = searchParams?.get('type') || ''
  const currency = searchParams?.get('currency') || ''

  const updateParam = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    if (val) params.set(key, val)
    else params.delete(key)
    params.delete('before')
    params.delete('after')
    router.push(`/dashboard/issuing/cards?${params.toString()}`)
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('filter')
    params.delete('program')
    params.delete('type')
    params.delete('currency')
    params.delete('before')
    params.delete('after')
    router.push(`/dashboard/issuing/cards?${params.toString()}`)
  }

  const handlePageChange = (type: 'before' | 'after', cursorValue: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('before')
    params.delete('after')
    if (cursorValue) params.set(type, cursorValue)
    router.push(`/dashboard/issuing/cards?${params.toString()}`)
  }

  const filterParts = [
    filter,
    cardType ? `type|eq|${cardType}` : '',
    currency ? `currency|eq|${currency}` : '',
    programId ? `program|eq|${programId}` : '',
  ].filter(Boolean)

  const { data, isLoading, error, refetch } = useCardControllerGetCards({
    limit: 10,
    expand: 'program' as any,
    search: searchInput.trim() || undefined,
    ...(before ? { before } : {}),
    ...(after ? { after } : {}),
    ...(filterParts.length ? { filter: filterParts.join(',') } : {}),
  } as any)

  const { data: cardMetricsRaw } = useCardControllerGetMetrics()
  const cardMetrics = (cardMetricsRaw as any)?.data

  const { data: authMetricsRaw } = useCardAuthorizationControllerGetMetrics({ period })
  const authMetrics = (authMetricsRaw as any)?.data

  const successRate: number = authMetrics?.successRate?.rate ?? 0
  const successRateDelta: number | null = authMetrics?.successRate?.change ?? null
  const declineRate: number = successRate > 0 ? +(100 - successRate).toFixed(1) : 0
  const declineRateDelta: number | null = successRateDelta !== null ? +(-successRateDelta).toFixed(2) : null

  const { data: programsData } = useCardProgramControllerGetCardPrograms({ limit: 100 } as any)
  const programOptions = [
    { label: 'All programs', value: '' },
    ...((programsData?.data as any)?.map((p: any) => ({ label: p.name, value: p.id })) || []),
  ]

  const cards = (data?.data as any) || []
  const hasMore = (data as any)?.metadata?.hasMore ?? false
  const hasPrevious = !!before

  const activeFilterCount = [filter, programId, cardType, currency].filter(Boolean).length
  const statusLabel = STATUS_OPTIONS.find((o) => o.value === filter)?.label ?? ''
  const programLabel = programOptions.find((o) => o.value === programId)?.label ?? ''

  const columns = [
    {
      header: 'Card',
      render: (card: any) => (
        <div className="flex items-center gap-3">
          <NetworkBadge value={card.network || card.program?.network} />
          <div>
            <div className="text-sm font-semibold text-content-primary">
              •••• {card.details?.last4 || '••••'}
            </div>
            <div className="text-xs text-content-tertiary">
              Exp {card.details?.expiry || '—'}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Cardholder',
      render: (card: any) => (
        <div className="text-sm font-normal text-content-primary">
          {card.details?.cardHolderName || card.holderName || card.holder?.name || <span className="text-content-tertiary font-normal">No cardholder</span>}
        </div>
      ),
    },
    {
      header: 'Card program',
      className: panelOpen ? 'hidden' : '',
      render: (card: any) => (
        <div className="text-sm font-normal text-content-primary">
          {card.program?.name || <span className="text-content-tertiary font-normal">No program</span>}
        </div>
      ),
    },
    {
      header: 'Card type',
      render: (card: any) => <Badge variant="type" value={card.type} />,
    },
    {
      header: 'Currency',
      className: panelOpen ? 'hidden' : '',
      render: (card: any) => <Currency code={card.program?.currency} />,
    },
    {
      header: 'Status',
      render: (card: any) => <Badge variant="status" value={card.status} />,
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Cards"
        description="View and manage all issued cards across your programs."
      />

      {/* Stats */}
      <div className="bg-surface-primary border border-border-primary-light rounded-xl px-5 py-4 flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
        <div className="flex-1 flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
        <StatValue
          label="Total cards issued"
          value={(cardMetrics?.total ?? 0).toLocaleString()}
          caption={<>{cardMetrics?.active ?? 0} active · {cardMetrics?.inactive ?? 0} inactive</>}
        />
        <div className="h-px md:h-auto md:w-px bg-border-primary-light flex-shrink-0" />
        <StatValue
          label="Blocked cards"
          value={(cardMetrics?.blocked ?? 0).toLocaleString()}
          tone={(cardMetrics?.blocked ?? 0) > 0 ? 'danger' : 'default'}
          delta={cardMetrics?.blockedThisWeek != null && cardMetrics.blockedThisWeek !== 0
            ? <Delta value={cardMetrics.blockedThisWeek} positiveIsGood={false} unit="" context="this week" />
            : undefined}
        />
        <div className="h-px md:h-auto md:w-px bg-border-primary-light flex-shrink-0" />
        <StatValue
          label="Auth success rate"
          value={`${successRate}%`}
          delta={successRateDelta !== null ? <Delta value={successRateDelta} context="vs last 7 days" /> : undefined}
        />
        <div className="h-px md:h-auto md:w-px bg-border-primary-light flex-shrink-0" />
        <StatValue
          label="Decline rate"
          value={`${declineRate}%`}
          delta={declineRateDelta !== null ? <Delta value={declineRateDelta} positiveIsGood={false} context="vs last 7 days" /> : undefined}
        />
        <div className="h-px md:h-auto md:w-px bg-border-primary-light flex-shrink-0" />
        <StatValue
          label="Avg transaction value"
          value={`₦${(authMetrics?.avgTransactionValue?.amount ?? 0).toLocaleString()}`}
          caption={authMetrics?.avgTransactionValue?.perUser != null
            ? `₦${authMetrics.avgTransactionValue.perUser.toLocaleString()} per user`
            : undefined}
        />
        </div>
        <div className="shrink-0 self-start">
          <PeriodSelect value={period} onChange={setPeriod} />
        </div>
      </div>

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

          {/* Card program */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {programId ? (
                <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-border-primary-main bg-surface-primary cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  Card program{' '}
                  <span className="text-content-tertiary">is</span>{' '}
                  {programLabel}
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); updateParam('program', '') }}
                    className="ml-0.5 leading-none cursor-pointer"
                  >
                    <X width={8} height={8} />
                  </button>
                </div>
              ) : (
                <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-dashed border-border-primary-dark bg-surface-primary shadow-whisper cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  Card program
                </div>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Card program</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={programId} onValueChange={(v) => updateParam('program', v)}>
                {programOptions.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Card type */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {cardType ? (
                <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-border-primary-main bg-surface-primary cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  Card type{' '}
                  <span className="text-content-tertiary">is</span>{' '}
                  {TYPE_LABELS[cardType] ?? cardType}
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
                  Card type
                </div>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel>Card type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={cardType} onValueChange={(v) => updateParam('type', v)}>
                {TYPE_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Currency */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {currency ? (
                <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-border-primary-main bg-surface-primary cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  Currency{' '}
                  <span className="text-content-tertiary">is</span>{' '}
                  {CURRENCY_LABELS[currency] ?? currency.toUpperCase()}
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
              <DropdownMenuRadioGroup value={currency} onValueChange={(v) => updateParam('currency', v)}>
                {CURRENCY_OPTIONS.map((opt) => (
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
              placeholder="Search cards..."
              value={searchInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
        data={cards}
        columns={columns}
        isLoading={isLoading}
        error={error ? getApiErrorMessage(error) : null}
        onRetry={refetch}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(row) => router.push(`/dashboard/issuing/cards/${row.id}`)}
        pagination={{ hasMore, hasPrevious, onPageChange: handlePageChange }}
        emptyState={{
          title: 'No cards found',
          description: activeFilterCount > 0
            ? 'No cards match your filters.'
            : 'Cards issued through your programs will appear here.',
          icon: <CreditCard width={20} height={20} />,
        }}
        resourceName="cards"
      />
      </div>
    </div>
  )
}

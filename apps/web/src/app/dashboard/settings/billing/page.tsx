'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Button,
  InputGroup, InputGroupAddon, InputGroupInput,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from '@/lib/pax'
import { Search, FileText, X } from 'lucide-react'
import { useBillingControllerGetAll } from '@/api/billings/billings'
import { useMode } from '@/context/ModeContext'
import { type ApiHydratedBilling } from '@/api/model'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import { StatValue } from '@/components/ui/StatValue'
import { formatAmount, formatDate, getApiErrorMessage } from '@/lib/format'

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Paid', value: 'paid' },
  { label: 'Due', value: 'due' },
  { label: 'Pending', value: 'pending' },
]

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label])
)

export default function BillingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchInput, setSearchInput] = useState('')
  const { isSandboxMode } = useMode()

  useEffect(() => {
    if (isSandboxMode) router.replace('/dashboard')
  }, [isSandboxMode, router])

  const before = searchParams?.get('before') || ''
  const after = searchParams?.get('after') || ''
  const status = searchParams?.get('status') || ''

  const updateParam = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    if (val) params.set(key, val)
    else params.delete(key)
    params.delete('before')
    params.delete('after')
    router.push(`/dashboard/settings/billing?${params.toString()}`)
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('status')
    params.delete('before')
    params.delete('after')
    router.push(`/dashboard/settings/billing?${params.toString()}`)
  }

  const handlePageChange = (type: 'before' | 'after', cursorValue: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('before')
    params.delete('after')
    if (cursorValue) params.set(type, cursorValue)
    router.push(`/dashboard/settings/billing?${params.toString()}`)
  }

  // Stats fetch (no pagination, no filters — always the full recent set)
  const { data: statsData } = useBillingControllerGetAll({ limit: 100 } as any)
  const allInvoices: ApiHydratedBilling[] = (statsData?.data as any) || []

  const statsCurrency = allInvoices[0]?.currency ?? 'NGN'
  const outstanding = allInvoices
    .filter((i) => i.status !== 'paid')
    .reduce((sum, i) => sum + (i.billedAmount ?? 0), 0)

  const currentPeriod = new Date().toISOString().slice(0, 7)
  const paidThisMonth = allInvoices
    .filter((i) => i.status === 'paid' && i.period === currentPeriod)
    .reduce((sum, i) => sum + (i.billedAmount ?? 0), 0)

  const nextDue = allInvoices
    .filter((i) => i.status !== 'paid' && i.dueDate)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]

  // Table fetch (paginated + filtered)
  const { data, isLoading, error, refetch } = useBillingControllerGetAll({
    limit: 20,
    countTotal: true,
    ...(before ? { before } : {}),
    ...(after ? { after } : {}),
    ...(status ? { filter: `status:${status}` } : {}),
  } as any)

  const invoicesRaw: ApiHydratedBilling[] = (data?.data as any) || []
  const hasMore = (data as any)?.metadata?.hasMore ?? false
  const hasPrevious = !!before

  // Client-side search by invoice number (API doesn't support it yet)
  const invoices = searchInput.trim()
    ? invoicesRaw.filter((i) =>
        i.invoiceNo?.toLowerCase().includes(searchInput.trim().toLowerCase()),
      )
    : invoicesRaw

  const activeFilterCount = [status].filter(Boolean).length
  const filtersActive = !!status || !!searchInput.trim()

  // "/" shortcut focuses search
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

  const columns = [
    {
      header: 'Invoice No.',
      render: (inv: ApiHydratedBilling) => (
        <span className="text-sm font-mono text-content-primary">{inv.invoiceNo}</span>
      ),
    },
    {
      header: 'Period',
      render: (inv: ApiHydratedBilling) => (
        <span className="text-sm text-content-secondary">{inv.period}</span>
      ),
    },
    {
      header: 'List amount',
      className: 'text-right',
      render: (inv: ApiHydratedBilling) => (
        <span className="text-sm tabular-nums text-content-secondary">
          {formatAmount(inv.listAmount, inv.currency)}
        </span>
      ),
    },
    {
      header: 'Billed amount',
      className: 'text-right',
      render: (inv: ApiHydratedBilling) => (
        <span className="text-sm font-semibold tabular-nums text-content-primary">
          {formatAmount(inv.billedAmount, inv.currency)}
        </span>
      ),
    },
    {
      header: 'Due date',
      render: (inv: ApiHydratedBilling) => (
        <span className="text-sm text-content-secondary tabular-nums">
          {formatDate(inv.dueDate)}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (inv: ApiHydratedBilling) => <Badge variant="status" value={inv.status} />,
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-content-primary leading-snug">Billing</h1>
        <p className="text-sm text-content-tertiary mt-1">Invoices and billing history.</p>
      </div>

      {/* Stats */}
      <div className="bg-surface-primary border border-border-primary-light rounded-xl px-5 py-4 flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
        <StatValue
          label="Outstanding"
          value={formatAmount(outstanding, statsCurrency)}
          loading={isLoading && allInvoices.length === 0}
          tone={outstanding > 0 ? 'danger' : 'default'}
        />
        <div className="h-px md:h-auto md:w-px bg-border-primary-light flex-shrink-0" />
        <StatValue
          label="Paid this month"
          value={formatAmount(paidThisMonth, statsCurrency)}
          loading={isLoading && allInvoices.length === 0}
        />
        <div className="h-px md:h-auto md:w-px bg-border-primary-light flex-shrink-0" />
        <StatValue
          label="Next due"
          value={nextDue ? formatDate(nextDue.dueDate) : '—'}
          caption={nextDue ? formatAmount(nextDue.billedAmount, nextDue.currency) : undefined}
          loading={isLoading && allInvoices.length === 0}
        />
      </div>

      {/* Toolbar + Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-6">
          {/* Left: pill filters */}
          <div className="flex items-center gap-2">
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

          {/* Right: search */}
          <InputGroup className="w-[240px] h-8 shrink-0">
            <InputGroupAddon>
              <Search width={14} height={14} className="text-content-tertiary" />
            </InputGroupAddon>
            <InputGroupInput
              ref={searchInputRef}
              placeholder="Search invoice no…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </InputGroup>
        </div>

        <DataTable
          data={invoices}
          columns={columns}
          isLoading={isLoading}
          error={error ? getApiErrorMessage(error) : null}
          onRetry={refetch}
          onRowClick={(row) => router.push(`/dashboard/settings/billing/${row.id}`)}
          pagination={{ hasMore, hasPrevious, onPageChange: handlePageChange }}
          emptyState={{
            title: filtersActive ? 'No invoices match' : 'No invoices yet',
            description: filtersActive
              ? 'Try adjusting your search or filters.'
              : 'Your billing history will appear here once invoices are generated.',
            icon: <FileText width={20} height={20} />,
            action: filtersActive ? undefined : (
              <Button
                variant="outline"
                color="secondary"
                size="sm"
                className="cursor-pointer"
                onClick={() => router.push('/dashboard/settings/billing/preview')}
              >
                View a sample invoice
              </Button>
            ),
          }}
          resourceName="invoices"
        />
      </div>
    </div>
  )
}

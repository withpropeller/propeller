'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from '@/lib/routing'
import {
  Button,
  InputGroup, InputGroupAddon, InputGroupInput,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from '@/lib/pax'
import { Search, Users, Plus as PlusIcon, X } from 'lucide-react'
import { useCustomerControllerGetAll } from '@/api/customers/customers'
import { usePanelContext } from '@/context/PanelContext'
import { useSearch } from '@/context/SearchContext'
import { PermissionGate } from '@/components/PermissionGate'
import { Permission } from '@/lib/permissions'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import { StatValue } from '@/components/ui/StatValue'
import { formatDatetime, getApiErrorMessage } from '@/lib/format'

const TYPE_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Individual', value: 'individual' },
  { label: 'Business', value: 'business' },
]

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  TYPE_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label])
)
const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label])
)

export default function Customers() {
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState(new Set<string>())
  const [searchInput, setSearchInput] = useState('')
  const { openPanel } = usePanelContext()
  const { addRecentItem } = useSearch()

  const before = searchParams?.get('before') || ''
  const after = searchParams?.get('after') || ''
  const statusFilter = searchParams?.get('status') || ''
  const typeFilter = searchParams?.get('type') || ''
  const panelId = searchParams?.get('id') || ''

  // Open panel when id is present in URL (e.g. navigating to /customers?id=xxx or redirected from /customers/[id])
  useEffect(() => {
    if (panelId) {
      openPanel('customer', panelId)
      addRecentItem('customer', panelId)
    }
  }, [panelId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search input
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // Reset pagination on search change
  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('before')
    params.delete('after')
    router.push(`/dashboard/customers?${params.toString()}`)
  }, [debouncedSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  // / keyboard shortcut (when not in an input)
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

  // Stats fetch (no pagination)
  const { data: statsData } = useCustomerControllerGetAll({ limit: 100 })
  const allCustomers = (statsData?.data as any) || []
  const totalCustomers: number = allCustomers.length
  const activeCount: number = allCustomers.filter((c: any) => c.status === 'active').length

  // Table fetch (paginated)
  const { data: tableData, isLoading, error, refetch } = useCustomerControllerGetAll({
    limit: 15,
    ...(before ? { before } : {}),
    ...(after ? { after } : {}),
    ...(statusFilter ? { filter: `status|eq|${statusFilter}` } : {}),
    ...(typeFilter ? { filter: `type|eq|${typeFilter}` } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  } as any)

  const customers = (tableData?.data as any) || []
  const hasMore = (tableData as any)?.metadata?.hasMore ?? false
  const hasPrevious = !!before

  const updateFilter = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    if (val) params.set(key, val)
    else params.delete(key)
    params.delete('before')
    params.delete('after')
    router.push(`/dashboard/customers?${params.toString()}`)
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('status')
    params.delete('type')
    params.delete('before')
    params.delete('after')
    router.push(`/dashboard/customers?${params.toString()}`)
  }

  const handlePageChange = (type: 'before' | 'after', cursorValue: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('before')
    params.delete('after')
    if (cursorValue) params.set(type, cursorValue)
    router.push(`/dashboard/customers?${params.toString()}`)
  }

  const activeFilterCount = [statusFilter, typeFilter].filter(Boolean).length
  const filtersActive = !!statusFilter || !!typeFilter || !!debouncedSearch

  const columns = [
    {
      header: 'Name',
      render: (c: any) => (
        <div className="flex flex-col text-left max-w-[200px]">
          <span className="text-sm font-medium text-content-primary truncate">{c.name || <span className="text-content-tertiary font-normal">No name</span>}</span>
        </div>
      ),
    },
    { header: 'Status', render: (c: any) => <Badge variant="status" value={c.status} /> },
    { header: 'Type', render: (c: any) => <Badge variant="type" value={c.type} /> },
    {
      header: 'Email',
      render: (c: any) => {
        const email = c.type === 'business'
          ? c.claims?.businessInformation?.email
          : c.claims?.individualInformation?.email
        return (
          <span className="text-sm text-content-secondary max-w-[200px] truncate block">
            {email ?? <span className="text-content-tertiary font-normal">No email</span>}
          </span>
        )
      },
    },
    {
      header: 'Phone',
      render: (c: any) => {
        const phone = c.type === 'business'
          ? c.claims?.businessInformation?.phoneNumber
          : c.claims?.individualInformation?.phoneNumber
        return (
          <span className="text-sm text-content-secondary truncate block">
            {phone ?? <span className="text-content-tertiary font-normal">No phone</span>}
          </span>
        )
      },
    },
    {
      header: 'Date',
      className: 'text-right hidden lg:table-cell',
      render: (c: any) => (
        <span className="text-sm text-content-secondary max-w-[200px] truncate block">
          {c.createdAt ? formatDatetime(c.createdAt) : <span className="text-content-tertiary font-normal">No date</span>}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-content-primary leading-snug">Customers</h1>
          <p className="text-sm text-content-tertiary mt-1">Manage your customers.</p>
        </div>
        <PermissionGate permission={Permission.CustomersCreate}>
          <Button color="primary" onClick={() => router.push('/dashboard/customers/new')} className="gap-2 cursor-pointer">
            <PlusIcon width={16} height={16} /> New customer
          </Button>
        </PermissionGate>
      </div>

      {/* Stats */}
      <div className="bg-surface-primary border border-border-primary-light rounded-xl px-5 py-4 flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
        <StatValue
          label="Total customers"
          value={totalCustomers.toLocaleString()}
          loading={isLoading && totalCustomers === 0}
        />
        <div className="h-px md:h-auto md:w-px bg-border-primary-light flex-shrink-0" />
        <StatValue
          label="Active"
          value={activeCount.toLocaleString()}
          loading={isLoading && activeCount === 0}
        />
      </div>

      {/* Toolbar + Table */}
      <div className="space-y-3">
      <div className="flex items-center justify-between gap-6">

        {/* Left: filter chips */}
        <div className="flex items-center gap-2">

          {/* Type filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {typeFilter ? (
                <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-border-primary-main bg-surface-primary cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  Type{' '}
                  <span className="text-content-tertiary">is</span>{' '}
                  {TYPE_LABELS[typeFilter] ?? typeFilter}
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); updateFilter('type', '') }}
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
              <DropdownMenuRadioGroup value={typeFilter} onValueChange={(v) => updateFilter('type', v)}>
                {TYPE_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {statusFilter ? (
                <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-border-primary-main bg-surface-primary cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                  Status{' '}
                  <span className="text-content-tertiary">is</span>{' '}
                  {STATUS_LABELS[statusFilter] ?? statusFilter}
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); updateFilter('status', '') }}
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
              <DropdownMenuRadioGroup value={statusFilter} onValueChange={(v) => updateFilter('status', v)}>
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
            placeholder="Search customers…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </InputGroup>
      </div>

      <DataTable
        data={customers}
        columns={columns}
        isLoading={isLoading}
        error={error ? getApiErrorMessage(error) : null}
        onRetry={refetch}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(row) => {
          const params = new URLSearchParams(searchParams?.toString())
          params.set('id', row.id)
          router.push(`/dashboard/customers?${params.toString()}`, { scroll: false })
        }}
        pagination={{ hasMore, hasPrevious, onPageChange: handlePageChange }}
        emptyState={{
          icon: <Users width={20} height={20} />,
          title: 'No customers found',
          description: filtersActive
            ? 'No customers match your search or filters.'
            : 'Customers will appear here once they are created.',
        }}
        resourceName="customers"
        idField="id"
      />
      </div>
    </div>
  )
}

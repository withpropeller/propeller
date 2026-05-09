'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PermissionGate } from '@/components/PermissionGate'
import { Permission } from '@/lib/permissions'
import {
  Skeleton,
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
import { Search, Landmark, User, Plus as PlusIcon, X } from 'lucide-react'
import { useAccountControllerGet } from '@/api/accounts/accounts'
import { usePanelContext } from '@/context/PanelContext'
import { useSearch } from '@/context/SearchContext'
import { Badge } from '@/components/ui/Badge'
import { CreateAccountModal } from '@/components/ui/CreateAccountModal'
import { DataTable } from '@/components/ui/DataTable'
import { Currency } from '@/components/ui/Currency'
import { formatDatetime } from '@/lib/format'

const TYPE_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Main', value: 'type|eq|main' },
  { label: 'Sub', value: 'type|eq|sub' },
  { label: 'Virtual', value: 'type|eq|virtual' },
]

const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  TYPE_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label])
)

export default function Accounts() {
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()
  const [selectedIds, setSelectedIds] = useState(new Set<string>())
  const { openPanel, panelState } = usePanelContext()
  const panelOpen = panelState.type !== null
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { addRecentItem } = useSearch()

  const before = searchParams?.get('before') || ''
  const after = searchParams?.get('after') || ''
  const filter = searchParams?.get('filter') || ''
  const search = searchParams?.get('search') || ''
  const panelId = searchParams?.get('id') || ''

  // Open panel when id is present in URL
  useEffect(() => {
    if (panelId) {
      openPanel('account', panelId)
      addRecentItem('account', panelId)
    }
  }, [panelId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch merchant accounts for stats
  const { data: merchantStatData, isLoading: merchantStatsLoading } = useAccountControllerGet({
    limit: 100,
    expand: ['customer'],
  })

  // Fetch table data
  const { data: tableData, isLoading: tableLoading, error: tableError, refetch } = useAccountControllerGet({
    limit: 15,
    expand: ['customer'],
    ...(before ? { before } : {}),
    ...(after ? { after } : {}),
    ...(filter ? { filter } : {}),
    ...(search ? { search } : {}),
  } as any)

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

  const accountsList = (tableData?.data as any) || []
  const hasMore = (tableData as any)?.metadata?.hasMore ?? false
  const hasPrevious = !!before
  const allMerchantAccounts = (merchantStatData?.data as any) || []

  const mainAccounts = allMerchantAccounts.filter((a: any) => a.type === 'main').length
  const subAccounts = allMerchantAccounts.filter((a: any) => a.type === 'sub').length
  const virtualAccounts = allMerchantAccounts.filter((a: any) => a.type === 'virtual').length

  const updateFilter = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    if (val) params.set(key, val)
    else params.delete(key)
    params.delete('before')
    params.delete('after')
    router.push(`/dashboard/accounts?${params.toString()}`)
  }

  const handlePageChange = (type: 'before' | 'after', cursorValue: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.delete('before')
    params.delete('after')
    if (cursorValue) params.set(type, cursorValue)
    router.push(`/dashboard/accounts?${params.toString()}`)
  }

  const activeFilterCount = [filter].filter(Boolean).length
  const typeLabel = TYPE_LABELS[filter] ?? ''

  const columns = [
    {
      header: 'Account name',
      render: (acc: any) => (
        <div className="flex flex-col text-left min-w-0">
          <span className="text-sm font-medium text-content-primary truncate">{acc.label || acc.name || <span className="text-content-tertiary font-normal">No name</span>}</span>
          <span className="text-[10px] text-content-tertiary font-mono truncate">{acc.addressShort}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      width: '8%',
      render: (acc: any) => <span className="text-sm text-content-secondary capitalize">{acc.type || '—'}</span>,
    },
    { header: 'Status', width: '8%', render: (acc: any) => <Badge variant="status" value={acc.status} /> },
    {
      header: 'Account number',
      render: (acc: any) => acc.depositChannels?.[0]?.accountNumber
        ? <span className="text-sm font-mono text-content-primary truncate block">{acc.depositChannels[0].accountNumber}</span>
        : <span className="text-sm text-content-tertiary font-normal">No account number</span>,
    },
    { header: 'Currency', width: '7%', render: (acc: any) => <Currency code={acc.currency} /> },
    {
      header: 'Customer',
      render: (acc: any) => (
        acc.owner === 'merchant' ? (
          <div className="flex items-center gap-2 text-content-quaternary opacity-80 min-w-0">
            <Landmark width={14} height={14} className="shrink-0" />
            <span className="text-xs font-medium truncate">Internal Treasury</span>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push('/dashboard/customers')
            }}
            className="flex items-center gap-2 group cursor-pointer min-w-0 w-full"
          >
            <div className="shrink-0 w-6 h-6 rounded-full bg-surface-secondary flex items-center justify-center group-hover:bg-action-primary-subtle/20 transition-colors">
              <User width={12} height={12} className="text-content-tertiary group-hover:text-action-primary-main transition-colors" />
            </div>
            <span className="text-sm font-medium text-content-secondary group-hover:text-action-primary-main transition-colors decoration-action-primary-main underline-offset-4 decoration-0 hover:decoration-1 truncate">
              {acc.customer?.name || 'Guest'}
            </span>
          </button>
        )
      )
    },
    {
      header: 'Date',
      className: panelOpen ? 'hidden' : 'hidden lg:table-cell',
      render: (acc: any) => <span className="text-sm text-content-secondary max-w-[200px] truncate block">{formatDatetime(acc.createdAt)}</span>
    }
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-content-primary leading-snug">Accounts</h1>
          <p className="text-sm text-content-tertiary mt-1">Manage your merchant and customer-owned financial wallets.</p>
        </div>
        <PermissionGate permission={Permission.AccountsCreate}>
          <Button color="primary" onClick={() => setShowCreateModal(true)} className="gap-2 cursor-pointer">
            <PlusIcon width={16} height={16} /> Create new account
          </Button>
        </PermissionGate>
        {showCreateModal && <CreateAccountModal onClose={() => setShowCreateModal(false)} />}
      </div>

      {/* Account type summary – commented out until we align on a pattern
      <div className="bg-surface-primary border border-border-primary-light rounded-xl px-1.5 py-1.5 flex items-center gap-1">
        {[
          { label: 'All accounts', value: '', count: allMerchantAccounts.length },
          { label: 'Main', value: 'type|eq|main', count: mainAccounts },
          { label: 'Sub', value: 'type|eq|sub', count: subAccounts },
          { label: 'Virtual', value: 'type|eq|virtual', count: virtualAccounts },
        ].map((item) => {
          const isActive = filter === item.value
          return (
            <button
              key={item.value}
              onClick={() => updateFilter('filter', item.value)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-surface-secondary text-content-primary shadow-sm'
                  : 'text-content-tertiary hover:text-content-secondary hover:bg-surface-secondary/50'
              }`}
            >
              {merchantStatsLoading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                <>
                  {item.label}
                  <span className={`text-xs tabular-nums ${isActive ? 'text-content-secondary' : 'text-content-quaternary'}`}>
                    {item.count.toLocaleString()}
                  </span>
                </>
              )}
            </button>
          )
        })}
      </div>
      */}

      {/* Toolbar + Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-6">

          {/* Left: filter chips */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {filter ? (
                  <div tabIndex={0} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-normal rounded-md border border-border-primary-main bg-surface-primary cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                    Type{' '}
                    <span className="text-content-tertiary">is</span>{' '}
                    {typeLabel}
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); updateFilter('filter', '') }}
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
                <DropdownMenuRadioGroup value={filter} onValueChange={(v) => updateFilter('filter', v)}>
                  {TYPE_OPTIONS.map((opt) => (
                    <DropdownMenuRadioItem key={opt.value} value={opt.value}>{opt.label}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {activeFilterCount > 0 && (
              <button
                className="text-sm font-semibold text-action-primary-main cursor-pointer"
                onClick={() => updateFilter('filter', '')}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Right: search */}
          <div className="flex items-center gap-2 shrink-0">
            <InputGroup className="w-[240px] h-8">
              <InputGroupAddon>
                <Search width={14} height={14} className="text-content-tertiary" />
              </InputGroupAddon>
              <InputGroupInput
                ref={searchInputRef}
                placeholder="Search by account number, name…"
                value={search}
                onChange={(e) => updateFilter('search', e.target.value)}
              />
            </InputGroup>
          </div>
        </div>

        <DataTable
          data={accountsList}
          columns={columns}
          isLoading={tableLoading}
          error={tableError}
          onRetry={refetch}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={(row) => {
            const params = new URLSearchParams(searchParams?.toString())
            params.set('id', row.id)
            router.push(`/dashboard/accounts?${params.toString()}`, { scroll: false })
          }}
          resourceName="accounts"
          pagination={{ hasMore, hasPrevious, onPageChange: handlePageChange }}
          emptyState={{
            title: 'No accounts found',
            description: filter
              ? 'No accounts match the selected type.'
              : 'Adjust your filters to see all available wallets.',
            icon: <Landmark width={24} height={24} />,
          }}
        />
      </div>
    </div>
  )
}

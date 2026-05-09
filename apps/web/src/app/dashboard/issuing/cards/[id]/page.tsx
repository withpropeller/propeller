'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import {
  Shield,
  Eye,
  EyeOff,
  CreditCard,
  Activity,
  Lock,
  Plus,
  UserPlus,
  Zap,
  MoreVertical,
  CheckCircle2,
  Copy,
  ArrowUpRight,
  ShieldCheck,
  Pencil,
  Tag,
} from 'lucide-react'
import {
  Button,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  toast,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/lib/pax'
import {
  useCardControllerGetOne,
  useCardControllerGetSecrets,
  useCardControllerPatch,
  useCardControllerBlock,
  useCardControllerUnblock,
  useCardControllerEnrollSafetoken,
  useCardControllerLinkById,
  useCardControllerGetFundingSourceBalance,
} from '@/api/cards/cards'
import { useCardTransactionControllerGet } from '@/api/card-transactions/card-transactions'
import { formatDatetime, formatAmount } from '@/lib/format'
import { useIssuingNav } from '@/context/IssuingNavContext'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import { CopyValue, OverviewCell, DetailCell, SectionHeader } from '@/components/ui/DetailPage'
import { NetworkBadge } from '@/components/ui/NetworkBadge'
import { ActivateCardModal } from '@/components/ui/ActivateCardModal'
import { FundCardModal } from '@/components/ui/FundCardModal'
import { AssignCardModal } from '@/components/ui/AssignCardModal'
import { SafetokenModal } from '@/components/ui/SafetokenModal'
import { EditCardSettingsModal } from '@/components/ui/EditCardSettingsModal'
import { CardSimulationsTab } from '@/components/ui/CardSimulations'

export default function CardDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = params.id as string
  const { setPageTitle } = useIssuingNav()

  // ── UI state
  const [showSecrets, setShowSecrets] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showSafetokenModal, setShowSafetokenModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showActivateModal, setShowActivateModal] = useState(false)
  const [showFundModal, setShowFundModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  // ── Safetoken form
  const [safetokenEmail, setSafetokenEmail] = useState('')
  const [safetokenPhone, setSafetokenPhone] = useState('')

  // ── Data
  const { data: cardRes, isLoading, error } = useCardControllerGetOne(id, { expand: 'program fundingSource customer' } as any)
  const card = (cardRes?.data as any) || null

  const {
    data: secretsRes,
    refetch: fetchSecrets,
    isFetching: isLoadingSecrets,
  } = useCardControllerGetSecrets(id, { query: { enabled: false } })
  const secrets = (secretsRes?.data as any) || null

  const { data: balanceRes } = useCardControllerGetFundingSourceBalance(
    id,
    undefined,
    { query: { enabled: !!card?.fundingSource } },
  )
  const balance = (balanceRes?.data as any)?.balance ?? null

  const { mutate: updateCard, isPending: isUpdatingCard } = useCardControllerPatch()
  const { mutate: blockCard, isPending: isBlockingCard } = useCardControllerBlock()
  const { mutate: unblockCard, isPending: isUnblockingCard } = useCardControllerUnblock()
  const { mutate: enrollSafetoken, isPending: isEnrollingSafetoken } = useCardControllerEnrollSafetoken()
  const { mutate: linkCard } = useCardControllerLinkById()

  // ── Topnav page title
  useEffect(() => {
    if (card?.details?.last4) setPageTitle(`•••• ${card.details.last4}`)
    return () => setPageTitle(null)
  }, [card?.details?.last4, setPageTitle])

  // ── Recent transactions
  const { data: txnsRes, isLoading: isLoadingTxns } = useCardTransactionControllerGet(
    { filter: `card:${id}`, limit: 5, expand: 'card.details authorization.dispute authorization.status' } as any,
  )

  if (isLoading) return <DetailSkeleton />
  if (error || !card)
    return (
      <div className="p-12 text-center max-w-xl mx-auto space-y-4">
        <div className="w-16 h-16 bg-feedback-danger-subtle text-feedback-danger-main rounded-full flex items-center justify-center mx-auto">
          <CreditCard width={32} height={32} />
        </div>
        <h2 className="text-xl font-bold">Failed to load card</h2>
        <p className="text-content-tertiary">
          We couldn&apos;t retrieve the details for this card. It may have been terminated or you
          may not have permission to view it.
        </p>
        <Button variant="outline" color="secondary" onClick={() => router.back()} className="mt-4">
          Go back
        </Button>
      </div>
    )

  /* ── Handlers ──────────────────────────────────────────────── */

  const handleReveal = async () => {
    if (!showSecrets) await fetchSecrets()
    setShowSecrets((v) => !v)
  }

  const isUpdatingStatus = isBlockingCard || isUnblockingCard

  const invalidateCards = () =>
    queryClient.invalidateQueries({ predicate: (query) => (query.queryKey[0] as string)?.startsWith('/cards') })

  const handleToggleStatus = () => {
    if (card.status === 'active') {
      blockCard({ id }, {
        onSuccess: () => { invalidateCards(); toast({ title: 'Card blocked', severity: 'success' }) },
        onError: (err: any) => toast({ title: 'Failed to block card', description: err?.message ?? 'Something went wrong.', severity: 'danger' }),
      })
    } else {
      unblockCard({ id }, {
        onSuccess: () => { invalidateCards(); toast({ title: 'Card unblocked', severity: 'success' }) },
        onError: (err: any) => toast({ title: 'Failed to unblock card', description: err?.message ?? 'Something went wrong.', severity: 'danger' }),
      })
    }
  }

  const handleEnrollSafetoken = () => {
    enrollSafetoken(
      { id, data: { email: safetokenEmail || undefined, phoneNumber: safetokenPhone || undefined } },
      {
        onSuccess: () => {
          setShowSafetokenModal(false)
          setSafetokenEmail('')
          setSafetokenPhone('')
          invalidateCards()
          toast({ title: 'Safetoken enrolled', severity: 'success' })
        },
      },
    )
  }

  const handleAssignCard = (customerId: string, fundingSourceId?: string) => {
    linkCard(
      {
        id,
        data: {
          customer: customerId as any,
          ...(fundingSourceId ? { fundingSource: fundingSourceId as any } : {}),
        },
      },
      { onSuccess: () => { setShowAssignModal(false); invalidateCards() } },
    )
  }

  const handleSaveSettings = (data: {
    controls: { allowedChannels: string[]; blockedChannels: string[]; spendingLimits: any[] }
    metadata: Record<string, string>
  }) => {
    // Save controls and metadata in a single patch call
    updateCard(
      {
        id,
        data: {
          controls: {
            allowedChannels: data.controls.allowedChannels,
            blockedChannels: data.controls.blockedChannels,
            spendingLimits: data.controls.spendingLimits,
          } as any,
          metadata: data.metadata as any,
        },
      },
      {
        onSuccess: () => {
          setShowSettingsModal(false)
          invalidateCards()
          toast({ title: 'Card settings updated', severity: 'success' })
        },
        onError: (err: any) => {
          toast({ title: 'Failed to update settings', description: err?.message ?? 'Something went wrong.', severity: 'danger' })
        },
      },
    )
  }

  const copyToClipboard = (value: string, label: string) => {
    navigator.clipboard.writeText(value)
    toast({ title: `${label} copied`, severity: 'success' })
  }

  const allowedChannels: string[] = card.controls?.allowedChannels ?? []
  const spendingLimits: any[] = card.controls?.spendingLimits ?? []
  const metadataObj: Record<string, string> = (card.metadata && typeof card.metadata === 'object') ? card.metadata : {}
  const metadataEntries = Object.entries(metadataObj)
  const isSafetokenEnrolled = !!card.security?.safetoken?.enrolled

  const txnColumns = [
    {
      header: 'Description',
      render: (txn: any) => (
        <span className="text-sm text-content-primary truncate block max-w-[280px]">
          {txn.description || 'Card transaction'}
        </span>
      ),
    },
    {
      header: 'Amount',
      className: 'text-right',
      render: (txn: any) => (
        <span className="text-sm font-semibold tabular-nums text-content-primary">
          {formatAmount(txn.amount, txn.currency)}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (txn: any) => <Badge variant="status" value={txn.status} />,
    },
    {
      header: 'Date',
      className: 'text-right hidden md:table-cell',
      render: (txn: any) => (
        <span className="text-sm text-content-secondary">{formatDatetime(txn.createdAt)}</span>
      ),
    },
  ]

  return (
    <>
    <div className="animate-in fade-in duration-300 pb-16 space-y-8">
      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4 min-w-0">
          <NetworkBadge value={card.network} />
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-content-primary tracking-tight tabular-nums">
                •••• {card.details?.last4 || '••••'}
              </h1>
              <Badge variant="status" value={card.status} />
            </div>
            <CopyValue value={card.id} />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {card.status === 'new' && !card.customer && (
            <Button color="primary" size="sm" className="gap-2" onClick={() => setShowAssignModal(true)}>
              <UserPlus width={14} height={14} /> Assign card
            </Button>
          )}
          {card.status === 'inactive' && card.customer && (
            <Button color="primary" size="sm" className="gap-2" onClick={() => setShowActivateModal(true)}>
              <Zap width={14} height={14} /> Activate card
            </Button>
          )}
          {card.status === 'active' && card.fundingSource && (
            <Button color="primary" size="sm" className="gap-2" onClick={() => setShowFundModal(true)}>
              <Plus width={14} height={14} /> Fund card
            </Button>
          )}

          {card.status === 'active' ? (
            <Button variant="outline" color="secondary" size="sm" onClick={handleToggleStatus} loading={isUpdatingStatus} className="gap-2">
              <Lock width={14} height={14} /> Freeze card
            </Button>
          ) : card.status === 'blocked' ? (
            <Button variant="outline" color="secondary" size="sm" onClick={handleToggleStatus} loading={isUpdatingStatus} className="gap-2">
              <Shield width={14} height={14} /> Unfreeze card
            </Button>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" color="secondary" size="sm" className="px-2.5" aria-label="More actions">
                <MoreVertical width={16} height={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => copyToClipboard(card.id, 'Card ID')}>
                <Copy width={14} height={14} className="mr-2" /> Copy card ID
              </DropdownMenuItem>
              {card.externalId && (
                <DropdownMenuItem onClick={() => copyToClipboard(card.externalId, 'External ID')}>
                  <Copy width={14} height={14} className="mr-2" /> Copy external ID
                </DropdownMenuItem>
              )}
              {(card.customer || card.program || card.fundingSource) && <DropdownMenuSeparator />}
              {card.customer && (
                <DropdownMenuItem onClick={() => router.push(`/dashboard/customers/${card.customer?.id || card.customer}`)}>
                  <UserPlus width={14} height={14} className="mr-2" /> View customer
                </DropdownMenuItem>
              )}
              {card.program && (
                <DropdownMenuItem onClick={() => router.push(`/dashboard/issuing/card-programs/${card.program?.id || card.program}`)}>
                  <CreditCard width={14} height={14} className="mr-2" /> View program
                </DropdownMenuItem>
              )}
              {card.fundingSource && (
                <DropdownMenuItem onClick={() => router.push(`/dashboard/accounts/${card.fundingSource?.id || card.fundingSource}`)}>
                  <Activity width={14} height={14} className="mr-2" /> View funding source
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Balance + Card Visual + Overview Strip ────────────── */}
      <div className="space-y-3">
        {/* Balance — sits above the grid so card & strip tops align */}
        <div className="lg:max-w-[280px]">
          <div className="text-center">
            <p className="text-xs font-medium text-content-tertiary mb-0.5">Balance</p>
            <p className="text-xl font-bold text-content-primary tabular-nums">
              {balance !== null ? formatAmount(balance, card.currency) : '—'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
          {/* Card visual column */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-full max-w-[280px] [perspective:1400px]">
            <div
              className={`relative aspect-[1.586/1] w-full transition-transform duration-700 ease-out [transform-style:preserve-3d] ${
                showSecrets ? '[transform:rotateY(180deg)]' : ''
              }`}
            >
              {/* FRONT */}
              <div
                className={`absolute inset-0 rounded-2xl p-5 overflow-hidden shadow-elevate3 select-none [backface-visibility:hidden] [-webkit-backface-visibility:hidden] ${
                  card.status === 'active'
                    ? 'bg-linear-to-br from-[#121419] via-[#1a1c23] to-[#0a0c10] ring-1 ring-white/10'
                    : 'bg-slate-300 grayscale ring-1 ring-slate-400/50'
                }`}
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="relative h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-semibold leading-none truncate">
                        {card.program?.name || 'Issuing'}
                      </span>
                    </div>
                    <NetworkBadge value={card.network} />
                  </div>
                  <div className="text-white font-mono text-base tracking-[0.18em]">
                    •••• •••• •••• {card.details?.last4 || '••••'}
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <div className="flex flex-col min-w-0 grow">
                      <span className="text-[9px] uppercase font-medium text-white/40 tracking-widest">Cardholder</span>
                      <span className="text-[11px] text-white/90 font-semibold uppercase truncate tracking-wide mt-0.5">
                        {card.details?.cardHolderName || 'N/A'}
                      </span>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-[9px] uppercase font-medium text-white/40 tracking-widest">Expires</span>
                      <span className="text-[11px] text-white/90 font-mono font-semibold mt-0.5">
                        {card.details?.expiry || '••/••'}
                      </span>
                    </div>
                  </div>
                </div>
                {card.status !== 'active' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1px] rounded-2xl gap-2">
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white ring-1 ring-white/20">
                      <Lock width={18} height={18} />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-white tracking-widest opacity-80">{card.status}</span>
                  </div>
                )}
              </div>

              {/* BACK */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-elevate3 bg-linear-to-br from-[#121419] via-[#1a1c23] to-[#0a0c10] ring-1 ring-white/10 [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(180deg)]">
                <div className="absolute left-0 right-0 top-6 h-8 bg-black/70" />
                <div className="absolute inset-0 p-5 pt-[72px] flex flex-col justify-end gap-4">
                  <div>
                    <span className="text-[9px] uppercase font-medium text-white/40 tracking-widest">Card number</span>
                    <div className="text-white font-mono text-sm tracking-[0.14em] mt-0.5">
                      {secrets?.pan
                        ? (secrets.pan as string).match(/.{1,4}/g)!.join(' ')
                        : `•••• •••• •••• ${card.details?.last4 || '••••'}`}
                    </div>
                  </div>
                  <div className="flex gap-6 items-end">
                    <div>
                      <span className="text-[9px] uppercase font-medium text-white/40 tracking-widest">Expiry</span>
                      <div className="text-white font-mono text-xs mt-0.5">{secrets?.expiry || card.details?.expiry || '••/••'}</div>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-medium text-white/40 tracking-widest">CVV</span>
                      <div className="text-white font-mono text-xs mt-0.5">{secrets?.cvv || '•••'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {card.status === 'active' && (
            <Button variant="outline" color="secondary" size="sm" onClick={handleReveal} loading={isLoadingSecrets} className="gap-2">
              {showSecrets ? <><EyeOff width={14} height={14} /> Hide details</> : <><Eye width={14} height={14} /> Show details</>}
            </Button>
          )}
        </div>

        {/* Overview strip — 2x3 grid to match card height */}
        <div className="bg-surface-primary border border-border-primary-light rounded-xl grid grid-cols-3 self-start">
          <OverviewCell label="Network">
            {card.network ? <NetworkBadge value={card.network} showLabel /> : <span className="text-content-quaternary">—</span>}
          </OverviewCell>
          <OverviewCell label="Currency">
            <span className="uppercase font-semibold">{card.currency || '—'}</span>
          </OverviewCell>
          <OverviewCell label="Type">
            <Badge variant="type" value={card.type || 'virtual'} />
          </OverviewCell>
          <OverviewCell label="Expiry">
            <span className="tabular-nums">{card.details?.expiry || '—'}</span>
          </OverviewCell>
          <OverviewCell label="Program">
            {card.program ? (
              <Link href={`/dashboard/issuing/card-programs/${card.program.id || card.program}`} className="text-action-primary-main hover:underline text-sm font-medium truncate block">
                {card.program.name || 'View program'}
              </Link>
            ) : <span className="text-content-quaternary">—</span>}
          </OverviewCell>
          <OverviewCell label="Created">
            <span className="tabular-nums">{formatDatetime(card.createdAt)}</span>
          </OverviewCell>
        </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="border-b border-border-primary-light gap-8 h-12">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="simulations">Simulations</TabsTrigger>
        </TabsList>

        {/* ── Overview tab ──────────────────────────────────────── */}
        <TabsContent value="overview" className="pt-6 space-y-8">

          {/* Safetoken Card (above details, no section header) */}
          {card.customer && !isSafetokenEnrolled && (
            <div className="border border-border-primary-light bg-surface-primary rounded-xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center shrink-0">
                <ShieldCheck width={20} height={20} className="text-content-tertiary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-content-primary">Enrol in 3D Secure</p>
                <p className="text-xs text-content-tertiary mt-0.5 mb-3 max-w-lg">
                  Protect this card with Safetoken OTP authentication. Cardholders will receive a one-time password to confirm online transactions.
                </p>
                <Button variant="outline" color="secondary" size="sm" onClick={() => setShowSafetokenModal(true)}>
                  Enrol now
                </Button>
              </div>
            </div>
          )}
          {card.customer && isSafetokenEnrolled && (
            <div className="border border-feedback-success-light bg-feedback-success-subtle/20 rounded-xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-feedback-success-light flex items-center justify-center shrink-0">
                <CheckCircle2 width={20} height={20} className="text-feedback-success-main" />
              </div>
              <div>
                <p className="text-sm font-semibold text-content-primary">Safetoken enrolled</p>
                <p className="text-xs text-content-tertiary mt-0.5">
                  This card is enrolled in 3D Secure OTP authentication. Cardholders can confirm online transactions with a one-time password.
                </p>
              </div>
            </div>
          )}

          {/* Details */}
          <div>
            <SectionHeader title="Details" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
              <DetailCell label="Card ID">
                <CopyValue value={card.id} />
              </DetailCell>
              {card.externalId && (
                <DetailCell label="External ID">
                  <CopyValue value={card.externalId} />
                </DetailCell>
              )}
              <DetailCell label="Cardholder">
                {card.details?.cardHolderName || <span className="text-content-quaternary">Unassigned</span>}
              </DetailCell>
              <DetailCell label="Customer">
                {card.customer ? (
                  <Link href={`/dashboard/customers/${card.customer.id || card.customer}`} className="text-action-primary-main hover:underline">
                    {card.customer.name || card.customer.email || 'View customer'}
                  </Link>
                ) : <span className="text-content-quaternary">—</span>}
              </DetailCell>
              <DetailCell label="Funding source">
                {card.fundingSource ? (
                  <Link href={`/dashboard/accounts/${card.fundingSource.id || card.fundingSource}`} className="text-action-primary-main hover:underline">
                    {card.fundingSource.label || card.fundingSource.name || 'View funding source'}
                  </Link>
                ) : <span className="text-content-quaternary">—</span>}
              </DetailCell>
              <DetailCell label="Created">
                <span className="tabular-nums">{formatDatetime(card.createdAt)}</span>
              </DetailCell>
            </div>
          </div>

          {/* Controls & Metadata (merged) */}
          {card.customer && (
            <div>
              <SectionHeader
                title="Controls & Metadata"
                action={
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="w-8 h-8 rounded-lg border border-border-primary-light flex items-center justify-center text-content-tertiary hover:text-content-primary hover:border-border-primary-main transition-colors"
                  >
                    <Pencil width={14} height={14} />
                  </button>
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                <DetailCell label="Allowed channels">
                  {allowedChannels.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {allowedChannels.map((ch) => (
                        <span key={ch} className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-secondary border border-border-primary-light text-xs font-medium text-content-primary capitalize">
                          {ch}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-content-quaternary">No channels configured</span>
                  )}
                </DetailCell>
                <DetailCell label="Spending limits">
                  {spendingLimits.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {spendingLimits.map((limit: any, i: number) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-secondary border border-border-primary-light text-xs font-medium text-content-primary">
                          {formatAmount(limit.amount, card.currency)}
                          <span className="text-content-tertiary ml-1 capitalize">/ {limit.interval}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-content-quaternary">No limits set</span>
                  )}
                </DetailCell>
                <DetailCell label="Metadata">
                  {metadataEntries.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {metadataEntries.map(([key, value]) => (
                        <span key={key} className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-secondary border border-border-primary-light text-xs font-mono text-content-primary">
                          <span className="text-content-tertiary">{key}:</span>&nbsp;{String(value)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-content-quaternary">No metadata</span>
                  )}
                </DetailCell>
              </div>
            </div>
          )}

          {/* Recent transactions */}
          <div>
            <SectionHeader
              title="Recent transactions"
              action={
                <Link
                  href={`/dashboard/issuing/transactions?filter=card|eq|${card.id}`}
                  className="text-sm text-content-tertiary hover:text-action-primary-main transition-colors inline-flex items-center gap-1"
                >
                  View all <ArrowUpRight width={14} height={14} />
                </Link>
              }
            />
            <DataTable
              data={(txnsRes?.data as any) || []}
              columns={txnColumns}
              isLoading={isLoadingTxns}
              selectable={false}
              resourceName="transactions"
              onRowClick={(row) => router.push(`/dashboard/issuing/transactions/${row.id}`)}
              pagination={{ hasMore: false, hasPrevious: false, onPageChange: () => {} }}
              emptyState={{
                title: 'No transactions yet',
                description: 'When this card is used for payments, they will appear here.',
                icon: <Activity width={20} height={20} />,
              }}
            />
          </div>
        </TabsContent>

        {/* ── Simulations tab ──────────────────────────────────── */}
        <TabsContent value="simulations" className="pt-6">
          <CardSimulationsTab cardId={id} cardType={card.type} hasCustomer={!!card.customer} />
        </TabsContent>
      </Tabs>
    </div>

    {/* ── Modals ─────────────────────────────────────────────── */}
    {showAssignModal && (
      <AssignCardModal
        onClose={() => setShowAssignModal(false)}
        onAssign={handleAssignCard}
        fundingSourceType={card.program?.authorization?.fundingSourceType}
      />
    )}
    {showActivateModal && (
      <ActivateCardModal cardId={id} onClose={() => setShowActivateModal(false)} />
    )}
    {showFundModal && (
      <FundCardModal
        cardId={id}
        currency={card.currency || card.fundingSource?.currency}
        fundingSourceLabel={card.fundingSource?.label}
        onClose={() => setShowFundModal(false)}
      />
    )}
    {showSafetokenModal && (
      <SafetokenModal
        onClose={() => setShowSafetokenModal(false)}
        onSubmit={handleEnrollSafetoken}
        email={safetokenEmail}
        onEmailChange={setSafetokenEmail}
        phone={safetokenPhone}
        onPhoneChange={setSafetokenPhone}
        loading={isEnrollingSafetoken}
      />
    )}
    {showSettingsModal && (
      <EditCardSettingsModal
        onClose={() => setShowSettingsModal(false)}
        onSave={handleSaveSettings}
        loading={isUpdatingCard}
        initialChannels={allowedChannels}
        initialLimits={spendingLimits}
        initialMetadata={metadataObj}
        currency={card.currency}
      />
    )}
    </>
  )
}

/* ── Skeleton ────────────────────────────────────────────────── */

function DetailSkeleton() {
  return (
    <div className="animate-in fade-in duration-300 pb-16 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-8 w-12 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-3.5 w-36" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-9 rounded-lg" />
        </div>
      </div>

      {/* Balance + Card + Overview */}
      <div className="space-y-3">
        <div className="lg:max-w-[280px] flex flex-col items-center gap-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="w-full max-w-[280px] aspect-[1.586/1] rounded-2xl" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
          <div className="bg-surface-primary border border-border-primary-light rounded-xl grid grid-cols-3 self-start">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-5 py-3.5 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs + content */}
      <div className="space-y-6">
        <Skeleton className="h-12 w-full rounded-lg" />
        <div className="space-y-8 pt-2">
          <Skeleton className="h-20 w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-5 w-24" />
            <div className="grid grid-cols-3 gap-x-8 gap-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

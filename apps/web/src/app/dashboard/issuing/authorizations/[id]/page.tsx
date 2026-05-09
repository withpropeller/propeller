'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import {
  Activity,
  Clock,
  Zap,
  AlertCircle,
  MoreVertical,
  ArrowLeft,
} from 'lucide-react'
import { Button, Skeleton } from '@/lib/pax'
import { DisputeAuthorizationModal } from '@/components/ui/DisputeAuthorizationModal'
import {
  useCardAuthorizationControllerGetOne,
  useCardAuthorizationControllerEarlyRefund,
} from '@/api/card-authorizations/card-authorizations'
import { formatDatetime, formatAmount } from '@/lib/format'
import { useIssuingNav } from '@/context/IssuingNavContext'
import { Badge } from '@/components/ui/Badge'
import { NetworkBadge } from '@/components/ui/NetworkBadge'
import { DataTable } from '@/components/ui/DataTable'
import {
  CopyValue,
  OverviewCell,
  DetailCell,
  SectionHeader,
} from '@/components/ui/DetailPage'

// ── Decline reason mapping ────────────────────────────────────────────────────
// Enum values come from ApiHydratedCardAuthorizationDeclineReason. Keep in sync
// if the API adds new reasons.

const DECLINE_REASON_LABELS: Record<string, { headline: string; detail: string }> = {
  'insufficient-funds': {
    headline: 'Insufficient funds',
    detail: "The card didn't have enough available balance to cover this authorization.",
  },
  'account-inactive': {
    headline: 'Account inactive',
    detail: "The cardholder's account is currently inactive.",
  },
  'account-not-found': {
    headline: 'Account not found',
    detail: 'The account linked to this card could not be located.',
  },
  'spending-control': {
    headline: 'Blocked by spending control',
    detail: 'A spending control rule prevented this authorization from going through.',
  },
  'timeout-default': {
    headline: 'Timed out',
    detail: "The issuer didn't respond in time, so the program's default timeout action was applied.",
  },
  'invalid-transaction': {
    headline: 'Invalid transaction',
    detail: 'The transaction was rejected as invalid by the network or issuer.',
  },
  'system-failure': {
    headline: 'System failure',
    detail: 'A system error prevented this authorization from being processed.',
  },
  'invalid-response': {
    headline: 'Invalid response',
    detail: 'The authorization response from the issuer was malformed or invalid.',
  },
  'authorization-declined': {
    headline: 'Authorization declined',
    detail: 'The issuer declined this authorization without a specific reason.',
  },
}

function getDeclineCopy(reason?: string | null) {
  if (!reason) return { headline: 'Declined', detail: 'No decline reason was recorded.' }
  return (
    DECLINE_REASON_LABELS[reason] ?? {
      headline: reason.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
      detail: 'This authorization was declined.',
    }
  )
}

// ── Empty ─────────────────────────────────────────────────────────────────────
// Muted inline text for missing values inside DetailCells.

function Empty({ children }: { children: React.ReactNode }) {
  return <span className="text-content-tertiary">{children}</span>
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuthorizationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { setPageTitle } = useIssuingNav()
  const [showDisputeModal, setShowDisputeModal] = useState(false)

  const { data: authRes, isLoading, error } = useCardAuthorizationControllerGetOne(
    id,
    { expand: 'card transactions events dispute' } as any,
  )
  const auth = (authRes?.data as any) || null

  const { mutate: earlyRefund, isPending: isRefunding } =
    useCardAuthorizationControllerEarlyRefund()

  useEffect(() => {
    if (auth?.networkData?.reference) setPageTitle(auth.networkData.reference)
    else if (id) setPageTitle(id)
    return () => setPageTitle(null)
  }, [auth?.networkData?.reference, id, setPageTitle])

  if (isLoading) return <DetailSkeleton />
  if (error || !auth)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-feedback-danger-subtle text-feedback-danger-main rounded-full flex items-center justify-center">
          <AlertCircle width={32} height={32} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-content-primary">Authorization not found</h3>
          <p className="text-content-tertiary max-w-64 mx-auto">
            We couldn&apos;t retrieve the details for this authorization. It may have been archived
            or the ID is incorrect.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()} className="gap-2 cursor-pointer">
          <ArrowLeft width={16} height={16} /> Back to Authorizations
        </Button>
      </div>
    )

  const canRefund =
    auth.dispute &&
    !['resolved', 'closed', 'declined'].includes(auth.dispute.status) &&
    auth.status !== 'reversed'

  const canDispute = !auth.dispute && auth.status === 'approved'

  const handleRefund = () => {
    if (
      window.confirm(
        'Are you sure you want to process an early refund? This action cannot be undone.',
      )
    ) {
      earlyRefund({ id })
    }
  }

  const card = auth.card && typeof auth.card === 'object' ? auth.card : null
  const cardId = card?.id ?? (typeof auth.card === 'string' ? auth.card : null)
  const last4 = card?.details?.last4
  const expiry = card?.details?.expiry
  const cardNetwork = card?.network ?? card?.program?.network

  const channelLabel = auth.channel ? String(auth.channel).toUpperCase() : null
  const typeLabel = auth.type ? String(auth.type).replace(/_/g, ' ') : null
  const acceptor = auth.networkData?.cardAcceptorNameLocation
  const hasFees = Number(auth.fees) > 0
  const isDeclined = auth.status === 'declined'
  const declineCopy = isDeclined ? getDeclineCopy(auth.declineReason) : null

  return (
    <div className="animate-in fade-in duration-300 pb-16 space-y-8">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-content-primary tracking-tight flex items-baseline gap-1.5">
              {formatAmount(auth.amount, auth.currency)}
            </h1>
            <Badge variant="status" value={auth.status} />
            {auth.dispute && <Badge variant="status" value="Disputed" />}
          </div>
          <p className="text-sm font-medium text-content-secondary truncate max-w-xl">
            {acceptor || <Empty>No acceptor recorded</Empty>}
          </p>
          <CopyValue value={auth.id} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canRefund && (
            <Button
              color="primary"
              size="sm"
              onClick={handleRefund}
              loading={isRefunding}
              className="gap-1.5 cursor-pointer"
            >
              <Zap width={14} height={14} /> Early refund
            </Button>
          )}
          {canDispute && (
            <Button
              variant="outline"
              color="secondary"
              size="sm"
              className="gap-1.5 cursor-pointer"
              onClick={() => setShowDisputeModal(true)}
            >
              <AlertCircle width={14} height={14} /> Dispute
            </Button>
          )}
          
        </div>
      </div>

      {/* ── Overview strip ──────────────────────────────────────────────────── */}
      <div className="bg-surface-primary border border-border-primary-light rounded-xl flex flex-col md:flex-row">
        <OverviewCell label="Card">
          {last4 ? (
            <Link
              href={cardId ? `/dashboard/issuing/cards/${cardId}` : '#'}
              className="flex items-center gap-2.5 group/card"
            >
              <NetworkBadge value={cardNetwork} />
              <div className="min-w-0">
                <div className="text-sm font-medium text-content-primary group-hover/card:text-action-primary-main transition-colors">
                  •••• {last4}
                </div>
                {expiry && (
                  <div className="text-xs text-content-tertiary">Exp {expiry}</div>
                )}
              </div>
            </Link>
          ) : (
            <Empty>No card linked</Empty>
          )}
        </OverviewCell>
        <OverviewCell label="Channel">
          {channelLabel ? (
            <span className="font-mono tabular-nums">{channelLabel}</span>
          ) : (
            <Empty>No channel</Empty>
          )}
        </OverviewCell>
        <OverviewCell label="Type">
          {typeLabel ? (
            <Badge variant="type" value={typeLabel} />
          ) : (
            <Empty>No type</Empty>
          )}
        </OverviewCell>
        <OverviewCell label="Decision">
          {auth.decisionType ? (
            <span className="capitalize">{auth.decisionType}</span>
          ) : (
            <Empty>No decision type</Empty>
          )}
        </OverviewCell>
        <OverviewCell label="Created">
          <span className="tabular-nums">{formatDatetime(auth.createdAt)}</span>
        </OverviewCell>
      </div>

      {/* ── Decline callout ─────────────────────────────────────────────────── */}
      {isDeclined && declineCopy && (
        <div className="bg-feedback-danger-subtle border border-feedback-danger-main/20 rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-feedback-danger-main/10 text-feedback-danger-main flex items-center justify-center shrink-0">
            <AlertCircle width={18} height={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-feedback-danger-main">
              Declined · {declineCopy.headline}
            </h3>
            <p className="text-sm text-content-secondary mt-0.5 leading-relaxed">
              {declineCopy.detail}
            </p>
          </div>
        </div>
      )}

      {/* ── Network data ────────────────────────────────────────────────────── */}
      <div>
        <SectionHeader title="Network data" />
        <div className="grid grid-cols-3 gap-x-8 gap-y-4">
          <DetailCell label="Network reference">
            {auth.networkData?.reference ? (
              <CopyValue value={auth.networkData.reference} />
            ) : (
              <Empty>No network reference</Empty>
            )}
          </DetailCell>
          <DetailCell label="RRN">
            {auth.networkData?.rrn ? (
              <CopyValue value={auth.networkData.rrn} />
            ) : (
              <Empty>No RRN</Empty>
            )}
          </DetailCell>
          <DetailCell label="STAN">
            {auth.networkData?.stan ? (
              <CopyValue value={auth.networkData.stan} />
            ) : (
              <Empty>No STAN</Empty>
            )}
          </DetailCell>
          <DetailCell label="Terminal ID">
            {auth.networkData?.terminalId ? (
              <CopyValue value={auth.networkData.terminalId} />
            ) : (
              <Empty>No terminal ID</Empty>
            )}
          </DetailCell>
          <DetailCell label="Network">
            {auth.networkData?.network ? (
              <span className="capitalize">{auth.networkData.network}</span>
            ) : (
              <Empty>No network</Empty>
            )}
          </DetailCell>
          <DetailCell label="Partner">
            {auth.networkData?.partner ? (
              <span className="capitalize">{auth.networkData.partner}</span>
            ) : (
              <Empty>No partner</Empty>
            )}
          </DetailCell>
        </div>
      </div>

      {/* ── Amount — only when fees are present ─────────────────────────────── */}
      {hasFees && (
        <div>
          <SectionHeader title="Amount" />
          <div className="grid grid-cols-3 gap-x-8 gap-y-4">
            <DetailCell label="Requested">
              <span className="tabular-nums">
                {formatAmount(auth.amount, auth.currency)}
              </span>
            </DetailCell>
            <DetailCell label="Fees">
              <span className="tabular-nums text-feedback-danger-main">
                {formatAmount(auth.fees, auth.currency)}
              </span>
            </DetailCell>
            <DetailCell label="Total">
              <span className="tabular-nums font-semibold">
                {formatAmount((auth.amount || 0) + (auth.fees || 0), auth.currency)}
              </span>
            </DetailCell>
          </div>
        </div>
      )}

      {/* ── Transactions ────────────────────────────────────────────────────── */}
      <div>
        <SectionHeader title="Transactions" />
        <DataTable
          data={auth.transactions || []}
          columns={[
            {
              header: 'Amount',
              render: (t: any) => (
                <span
                  className={[
                    'text-sm font-medium tabular-nums',
                    t.type === 'reversal'
                      ? 'text-feedback-success-main'
                      : 'text-feedback-danger-main',
                  ].join(' ')}
                >
                  {t.type === 'reversal' ? '+' : '-'}
                  {formatAmount(t.amount, t.currency)}
                </span>
              ),
            },
            {
              header: 'Type',
              render: (t: any) => <Badge variant="type" value={t.type} />,
            },
            {
              header: 'Date',
              render: (t: any) => (
                <span className="text-sm text-content-tertiary tabular-nums">
                  {formatDatetime(t.createdAt)}
                </span>
              ),
            },
          ]}
          selectable={false}
          onRowClick={(row) =>
            router.push(`/dashboard/issuing/transactions/${row.id}`)
          }
          resourceName="transactions"
          emptyState={{
            title: 'No related postings',
            description: 'Settlements and reversals will appear here after clearing.',
            icon: <Activity width={24} height={24} />,
          }}
        />
      </div>

      {/* ── Audit trail ─────────────────────────────────────────────────────── */}
      <div>
        <SectionHeader title="Events" />
        <DataTable
          data={auth.events || []}
          columns={[
            {
              header: 'Event type',
              render: (ev: any) => (
                <span className="text-sm font-medium text-content-primary">{ev.type}</span>
              ),
            },
            {
              header: 'Attempts',
              render: (ev: any) => (
                <span className="text-sm text-content-secondary tabular-nums">
                  {ev.attempts?.length ?? 0}
                </span>
              ),
            },
            {
              header: 'Date',
              render: (ev: any) => (
                <span className="text-sm text-content-tertiary tabular-nums">
                  {formatDatetime(ev.createdAt)}
                </span>
              ),
            },
          ]}
          selectable={false}
          onRowClick={(ev) => router.push(`/dashboard/developer/events/${ev.id}`)}
          resourceName="events"
          emptyState={{
            title: 'No events yet',
            description: 'Lifecycle events will appear here as they are processed.',
            icon: <Clock width={24} height={24} />,
          }}
        />
      </div>

      {showDisputeModal && (
        <DisputeAuthorizationModal
          authorizationId={id}
          onClose={() => setShowDisputeModal(false)}
        />
      )}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="pb-16 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-3.5 w-36" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>

      {/* Overview strip */}
      <div className="bg-surface-primary border border-border-primary-light rounded-xl flex flex-col md:flex-row">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-5 py-3.5 md:flex-1 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Section: Network data */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-3 gap-x-8 gap-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>

      {/* Sections: tables */}
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-14 w-full rounded" />
          <Skeleton className="h-14 w-full rounded" />
        </div>
      ))}
    </div>
  )
}

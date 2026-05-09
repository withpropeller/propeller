'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import {
  Clock,
  AlertCircle,
  MoreVertical,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import { Button, Skeleton } from '@/lib/pax'
import { DisputeAuthorizationModal } from '@/components/ui/DisputeAuthorizationModal'
import { useCardTransactionControllerGetOne } from '@/api/card-transactions/card-transactions'
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

// ── Empty ─────────────────────────────────────────────────────────────────────
// Muted inline text for missing values inside DetailCells and overview cells.

function Empty({ children }: { children: React.ReactNode }) {
  return <span className="text-content-tertiary">{children}</span>
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TransactionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { setPageTitle } = useIssuingNav()
  const [showDisputeModal, setShowDisputeModal] = useState(false)

  const { data: txnRes, isLoading, error } = useCardTransactionControllerGetOne(
    id,
    {
      expand:
        'card.details authorization.dispute.evidence authorization.status authorization.events',
    } as any,
  )
  const txn = (txnRes?.data as any) || null

  useEffect(() => {
    if (txn?.networkData?.reference) setPageTitle(txn.networkData.reference)
    else if (id) setPageTitle(id)
    return () => setPageTitle(null)
  }, [txn?.networkData?.reference, id, setPageTitle])

  if (isLoading) return <DetailSkeleton />
  if (error || !txn)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-feedback-danger-subtle text-feedback-danger-main rounded-full flex items-center justify-center">
          <AlertCircle width={32} height={32} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-content-primary">Transaction not found</h3>
          <p className="text-content-tertiary max-w-64 mx-auto">
            We couldn&apos;t retrieve the details for this transaction. It may have been archived
            or the ID is incorrect.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()} className="gap-2 cursor-pointer">
          <ArrowLeft width={16} height={16} /> Back to Transactions
        </Button>
      </div>
    )

  const canDispute =
    !txn.authorization?.dispute && txn.authorization?.status === 'approved'

  const card = txn.card && typeof txn.card === 'object' ? txn.card : null
  const cardId = card?.id ?? (typeof txn.card === 'string' ? txn.card : null)
  const last4 = card?.details?.last4
  const expiry = card?.details?.expiry
  const cardNetwork = card?.network ?? card?.program?.network

  const customer = txn.customer && typeof txn.customer === 'object' ? txn.customer : null
  const customerId = customer?.id ?? (typeof txn.customer === 'string' ? txn.customer : null)

  const channelLabel = txn.channel ? String(txn.channel).toUpperCase() : null
  const typeLabel = txn.type ? String(txn.type).replace(/_/g, ' ') : null
  const acceptor = txn.networkData?.cardAcceptorNameLocation
  const hasFees = Number(txn.fees) > 0
  const isCredit = (txn.amount ?? 0) < 0

  return (
    <div className="animate-in fade-in duration-300 pb-16 space-y-8">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-content-primary tracking-tight flex items-baseline gap-1.5">
              {isCredit ? '+' : ''}
              {formatAmount(Math.abs(txn.amount ?? 0), txn.currency)}
            </h1>
            {txn.status && <Badge variant="status" value={txn.status} />}
            {txn.authorization?.dispute && <Badge variant="status" value="Disputed" />}
          </div>
          <p className="text-sm font-medium text-content-secondary truncate max-w-xl">
            {acceptor || <Empty>No merchant recorded</Empty>}
          </p>
          <CopyValue value={txn.id} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
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
          <Button
            variant="outline"
            color="secondary"
            size="sm"
            className="w-9 p-0 cursor-pointer"
            aria-label="More options"
          >
            <MoreVertical width={14} height={14} />
          </Button>
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
        <OverviewCell label="Customer">
          {customer?.name ? (
            <Link
              href={customerId ? `/dashboard/customers/${customerId}` : '#'}
              className="text-sm font-medium text-content-primary hover:text-action-primary-main transition-colors truncate block"
            >
              {customer.name}
            </Link>
          ) : (
            <Empty>No customer</Empty>
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
        <OverviewCell label="Created">
          <span className="tabular-nums">{formatDatetime(txn.createdAt)}</span>
        </OverviewCell>
      </div>

      {/* ── Network data ────────────────────────────────────────────────────── */}
      <div>
        <SectionHeader title="Network data" />
        <div className="grid grid-cols-3 gap-x-8 gap-y-4">
          <DetailCell label="Network reference">
            {txn.networkData?.reference ? (
              <CopyValue value={txn.networkData.reference} />
            ) : (
              <Empty>No network reference</Empty>
            )}
          </DetailCell>
          <DetailCell label="RRN">
            {txn.networkData?.rrn ? (
              <CopyValue value={txn.networkData.rrn} />
            ) : (
              <Empty>No RRN</Empty>
            )}
          </DetailCell>
          <DetailCell label="STAN">
            {txn.networkData?.stan ? (
              <CopyValue value={txn.networkData.stan} />
            ) : (
              <Empty>No STAN</Empty>
            )}
          </DetailCell>
          <DetailCell label="Terminal ID">
            {txn.networkData?.terminalId ? (
              <CopyValue value={txn.networkData.terminalId} />
            ) : (
              <Empty>No terminal ID</Empty>
            )}
          </DetailCell>
          <DetailCell label="Merchant">
            {acceptor ? (
              <span>{acceptor}</span>
            ) : (
              <Empty>No merchant</Empty>
            )}
          </DetailCell>
          <DetailCell label="MCC">
            {txn.networkData?.mcc ? (
              <span className="font-mono text-xs">{txn.networkData.mcc}</span>
            ) : (
              <Empty>No MCC</Empty>
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
                {formatAmount(txn.amount, txn.currency)}
              </span>
            </DetailCell>
            <DetailCell label="Fees">
              <span className="tabular-nums text-feedback-danger-main">
                {formatAmount(txn.fees, txn.currency)}
              </span>
            </DetailCell>
            <DetailCell label="Total">
              <span className="tabular-nums font-semibold">
                {formatAmount((txn.amount || 0) + (txn.fees || 0), txn.currency)}
              </span>
            </DetailCell>
          </div>
        </div>
      )}

      {/* ── Timing ──────────────────────────────────────────────────────────── */}
      <div>
        <SectionHeader title="Timing" />
        <div className="grid grid-cols-3 gap-x-8 gap-y-4">
          <DetailCell label="Processing date">
            {txn.createdAt ? (
              <span className="tabular-nums">{formatDatetime(txn.createdAt)}</span>
            ) : (
              <Empty>No processing date</Empty>
            )}
          </DetailCell>
          <DetailCell label="Settlement date">
            <Empty>No settlement date</Empty>
          </DetailCell>
          <DetailCell label="Updated at">
            {txn.updatedAt ? (
              <span className="tabular-nums">{formatDatetime(txn.updatedAt)}</span>
            ) : (
              <Empty>No update recorded</Empty>
            )}
          </DetailCell>
        </div>
      </div>

      {/* ── Authorization ───────────────────────────────────────────────────── */}
      <div>
        <SectionHeader
          title="Authorization"
          action={
            txn.authorization?.id ? (
              <Button
                variant="outline"
                color="secondary"
                size="sm"
                className="gap-1.5 cursor-pointer"
                onClick={() =>
                  router.push(`/dashboard/issuing/authorizations/${txn.authorization.id}`)
                }
              >
                View authorization <ArrowRight width={14} height={14} />
              </Button>
            ) : undefined
          }
        />
        {txn.authorization ? (
          <div className="grid grid-cols-3 gap-x-8 gap-y-4">
            <DetailCell label="Authorization ID">
              {txn.authorization.id ? (
                <CopyValue value={txn.authorization.id} />
              ) : (
                <Empty>No authorization ID</Empty>
              )}
            </DetailCell>
            <DetailCell label="Auth status">
              {txn.authorization.status ? (
                <Badge variant="status" value={txn.authorization.status} />
              ) : (
                <Empty>No status</Empty>
              )}
            </DetailCell>
            <DetailCell label="Auth type">
              {txn.authorization.type ? (
                <Badge variant="type" value={String(txn.authorization.type).replace(/_/g, ' ')} />
              ) : (
                <Empty>No type</Empty>
              )}
            </DetailCell>
            <DetailCell label="Decision">
              {txn.authorization.decisionType ? (
                <span className="capitalize">{txn.authorization.decisionType}</span>
              ) : (
                <Empty>No decision</Empty>
              )}
            </DetailCell>
            <DetailCell label="Dispute">
              {txn.authorization.dispute?.id ? (
                <CopyValue value={txn.authorization.dispute.id} />
              ) : (
                <Empty>No dispute</Empty>
              )}
            </DetailCell>
          </div>
        ) : (
          <p className="text-sm text-content-tertiary italic">
            This transaction is not linked to an authorization.
          </p>
        )}
      </div>

      {/* ── Audit trail ─────────────────────────────────────────────────────── */}
      <div>
        <SectionHeader title="Audit trail" />
        <DataTable
          data={txn.authorization?.events || []}
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
          onRowClick={(ev: any) => router.push(`/dashboard/developer/events/${ev.id}`)}
          resourceName="events"
          emptyState={{
            title: 'No events yet',
            description: 'Lifecycle events will appear here as they are processed.',
            icon: <Clock width={24} height={24} />,
          }}
        />
      </div>

      {showDisputeModal && txn.authorization?.id && (
        <DisputeAuthorizationModal
          authorizationId={txn.authorization.id}
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

      {/* Section: Timing */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-3 gap-x-8 gap-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>

      {/* Section: Authorization */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-3 gap-x-8 gap-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>

      {/* Section: Audit trail */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-14 w-full rounded" />
        <Skeleton className="h-14 w-full rounded" />
      </div>
    </div>
  )
}

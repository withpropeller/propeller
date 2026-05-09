'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Plus,
  Settings2,
  Send,
  Activity,
  CreditCard,
  ShieldCheck,
  ExternalLink,
  Pencil,
} from 'lucide-react'
import Link from 'next/link'
import { Button, Skeleton } from '@/lib/pax'
import {
  useCardProgramControllerGet,
  useCardProgramControllerRequestApproval,
} from '@/api/card-programs/card-programs'
import { useCardControllerGetCards } from '@/api/cards/cards'
import { formatDate } from '@/lib/format'
import { useIssuingNav } from '@/context/IssuingNavContext'
import { Badge } from '@/components/ui/Badge'
import { NetworkBadge } from '@/components/ui/NetworkBadge'
import { Currency } from '@/components/ui/Currency'
import { DataTable } from '@/components/ui/DataTable'
import { CopyValue, OverviewCell, DetailCell, SectionHeader } from '@/components/ui/DetailPage'

// ── EditButton ────────────────────────────────────────────────────────────────

function EditButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded-lg border border-border-primary-light flex items-center justify-center text-content-tertiary hover:text-content-primary hover:border-border-primary-main transition-colors"
    >
      <Pencil width={14} height={14} />
    </button>
  )
}

// ── NotConfigured ─────────────────────────────────────────────────────────────

function NotConfigured({ href }: { href?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-content-tertiary text-sm">Not configured</span>
      {href && (
        <Link href={href} className="link text-xs">
          Configure
        </Link>
      )}
    </span>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CardProgramDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { setPageTitle } = useIssuingNav()

  const { data: programRes, isLoading, error } = useCardProgramControllerGet(id, {
    expand: 'bin',
  } as any)
  const program = (programRes?.data as any) || null

  const { data: cardsRes, isLoading: isLoadingCards } = useCardControllerGetCards(
    { filter: `program:${id}`, limit: 10, sort: 'createdAt_desc' as any, expand: 'program' } as any,
  )
  const cards = (cardsRes?.data as any) || []

  const { mutate: requestApproval, isPending: isRequestingApproval } =
    useCardProgramControllerRequestApproval()

  useEffect(() => {
    if (program?.name) setPageTitle(program.name)
    return () => setPageTitle(null)
  }, [program?.name, setPageTitle])

  if (isLoading) return <DetailSkeleton />
  if (error || !program)
    return (
      <div className="p-12 text-center max-w-xl mx-auto space-y-4">
        <div className="w-16 h-16 bg-feedback-danger-subtle text-feedback-danger-main rounded-full flex items-center justify-center mx-auto">
          <ShieldCheck width={32} height={32} />
        </div>
        <h2 className="text-xl font-bold">Failed to load program</h2>
        <p className="text-content-tertiary">
          We couldn&apos;t retrieve the details for this card program. It may have been deleted or
          you may not have permission to view it.
        </p>
        <Button variant="outline" color="secondary" onClick={() => router.back()} className="mt-4">
          Go back
        </Button>
      </div>
    )

  const isLive = program.status === 'live'
  const isVirtual = program.type === 'virtual'
  const canEdit = !isLive && program.status !== 'approval-requested'

  const cardColumns = [
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
          {card.cardholder?.name || card.holderName || card.holder?.name || (
            <span className="text-content-tertiary font-normal">No cardholder</span>
          )}
        </div>
      ),
    },
    { header: 'Status', render: (card: any) => <Badge variant="status" value={card.status} /> },
    {
      header: 'Created',
      render: (card: any) => (
        <span className="text-sm text-content-secondary tabular-nums">
          {formatDate(card.createdAt)}
        </span>
      ),
    },
  ]

  return (
    <div className="animate-in fade-in duration-300 pb-16 space-y-8">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-content-primary tracking-tight">
              {program.name}
            </h1>
            <Badge variant="status" value={program.status} />
          </div>
          <CopyValue value={program.id} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {program.status !== 'approval-requested' && !isLive && (
            <Button
              variant="outline"
              color="secondary"
              size="sm"
              onClick={() => requestApproval({ id })}
              loading={isRequestingApproval}
              className="gap-1.5"
            >
              <Send width={14} height={14} /> Request approval
            </Button>
          )}
          {canEdit && (
            <Button variant="outline" color="secondary" size="sm" className="gap-1.5">
              <Settings2 width={14} height={14} /> Edit Program
            </Button>
          )}
          {isLive && isVirtual && (
            <Button color="primary" size="sm" className="gap-1.5">
              <Plus width={14} height={14} /> Issue new virtual card
            </Button>
          )}
        </div>
      </div>

      {/* ── Overview strip ──────────────────────────────────────────────────── */}
      <div className="bg-surface-primary border border-border-primary-light rounded-xl flex flex-col md:flex-row">
        <OverviewCell label="Network">
          {program.network ? (
            <NetworkBadge value={program.network} showLabel />
          ) : (
            <span className="text-content-tertiary">No network</span>
          )}
        </OverviewCell>
        <OverviewCell label="Currency">
          {program.currency ? (
            <Currency code={program.currency} />
          ) : (
            <span className="text-content-tertiary">No currency</span>
          )}
        </OverviewCell>
        <OverviewCell label="Type">
          {program.type ? (
            <Badge variant="type" value={program.type} />
          ) : (
            <span className="text-content-tertiary">No type</span>
          )}
        </OverviewCell>
        <OverviewCell label="BIN">
          {program.bin?.bin ? (
            <CopyValue value={program.bin.bin} />
          ) : (
            <span className="text-content-tertiary">No BIN</span>
          )}
        </OverviewCell>
      </div>

      {/* ── Cards ─────────────────────────────────────────────────────────── */}
      <div>
        <SectionHeader
          title="Cards"
          action={
            <Link
              href={`/dashboard/issuing/cards?program=${id}`}
              className="link text-sm"
            >
              View all →
            </Link>
          }
        />
        <DataTable
          data={cards}
          columns={cardColumns}
          isLoading={isLoadingCards}
          selectable={false}
          onRowClick={(row) => router.push(`/dashboard/issuing/cards/${row.id}`)}
          resourceName="cards"
          emptyState={{
            title: 'No cards yet',
            description: 'Cards provisioned under this program will appear here.',
            icon: <CreditCard width={24} height={24} />,
          }}
        />
      </div>

      {/* ── Authorization ──────────────────────────────────────────────────── */}
      <div>
        <SectionHeader
          title="Authorization"
          action={canEdit ? <EditButton /> : undefined}
        />
        <div className="grid grid-cols-3 gap-x-8 gap-y-4">
          <DetailCell label="Funding source type">
            <span className="capitalize">
              {program.authorization?.fundingSourceType?.replace(/_/g, ' ') || 'Standard'}
            </span>
          </DetailCell>
          <DetailCell label="Webhook">
            {program.authorization?.webhook ? (
              <Link
                href={`/dashboard/developer/webhooks/${program.authorization.webhook}`}
                className="link font-mono text-xs truncate block"
              >
                {program.authorization.webhook}
              </Link>
            ) : (
              <NotConfigured href="/dashboard/developer/webhooks" />
            )}
          </DetailCell>
          <DetailCell label="Settlement Account">
            {program.authorization?.poolAccount ? (
              <Link
                href={`/dashboard/accounts/${program.authorization.poolAccount}`}
                className="link font-mono text-xs truncate block"
              >
                {program.authorization.poolAccount}
              </Link>
            ) : (
              <NotConfigured href="/dashboard/accounts" />
            )}
          </DetailCell>
          {program.authorization?.earlyRefundAccount && (
            <DetailCell label="Early Refund Account">
              <Link
                href={`/dashboard/accounts/${program.authorization.earlyRefundAccount}`}
                className="link font-mono text-xs truncate block"
              >
                {program.authorization.earlyRefundAccount}
              </Link>
            </DetailCell>
          )}
          <DetailCell label="Default Timeout Action">
            <span className="capitalize">{program.authorization?.timeoutDefault || 'Decline'}</span>
          </DetailCell>
        </div>
      </div>

      {/* ── Personalization ────────────────────────────────────────────────── */}
      <div>
        <SectionHeader
          title="Personalization"
          action={canEdit ? <EditButton /> : undefined}
        />
        <div className="grid grid-cols-3 gap-x-8 gap-y-4">
          <DetailCell label="Artwork File/Link">
            {program.personalization?.frontArtworkFile ? (
              <a
                href={program.personalization.frontArtworkFile}
                target="_blank"
                rel="noreferrer"
                className="link inline-flex items-center gap-1.5 font-medium"
              >
                Click to view artwork
                <ExternalLink width={12} height={12} />
              </a>
            ) : (
              <span className="text-content-tertiary">No artwork</span>
            )}
          </DetailCell>
          <DetailCell label="Card Display Name">
            {program.personalization?.defaultCardholderName || (
              <span className="text-content-tertiary">No display name</span>
            )}
          </DetailCell>
          <DetailCell label="Print Display Name">
            {program.personalization?.printCardholderName || (
              <span className="text-content-tertiary">No print name</span>
            )}
          </DetailCell>
        </div>
      </div>

      {/* ── Distribution ───────────────────────────────────────────────────── */}
      <div>
        <SectionHeader title="Distribution" />
        <div className="grid grid-cols-3 gap-x-8 gap-y-4">
          <DetailCell label="Type">
            {program.distribution?.type ? (
              <span className="capitalize">{program.distribution.type}</span>
            ) : (
              <NotConfigured href="/dashboard/issuing/card-programs" />
            )}
          </DetailCell>
          {program.distribution?.shippingAddress && (
            <>
              <DetailCell label="Address 1">
                {program.distribution.shippingAddress.line1 || program.distribution.shippingAddress.street || (
                  <span className="text-content-tertiary">No address</span>
                )}
              </DetailCell>
              <DetailCell label="Address 2">
                {program.distribution.shippingAddress.line2 || (
                  <span className="text-content-tertiary">No address</span>
                )}
              </DetailCell>
              <DetailCell label="City">
                {program.distribution.shippingAddress.city || (
                  <span className="text-content-tertiary">No city</span>
                )}
              </DetailCell>
              <DetailCell label="State">
                {program.distribution.shippingAddress.state || (
                  <span className="text-content-tertiary">No state</span>
                )}
              </DetailCell>
              <DetailCell label="Country">
                {program.distribution.shippingAddress.countryCode || (
                  <span className="text-content-tertiary">No country</span>
                )}
              </DetailCell>
            </>
          )}
          {program.distribution?.phoneNumber && (
            <DetailCell label="Phone Number">
              {program.distribution.phoneNumber}
            </DetailCell>
          )}
        </div>
      </div>

      {/* ── Activity ───────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div>
          <SectionHeader title="API Logs" />
          <div className="py-10 flex flex-col items-center justify-center border border-dashed border-border-primary-light rounded-xl bg-surface-secondary/30 text-center">
            <div className="w-10 h-10 bg-surface-primary rounded-full flex items-center justify-center border border-border-primary-light mb-3">
              <Activity width={18} height={18} className="text-content-tertiary" />
            </div>
            <p className="text-sm font-semibold text-content-primary">No logs yet</p>
            <p className="text-xs text-content-tertiary max-w-52 mt-1 leading-relaxed">
              API logs will appear here once requests are made against this program.
            </p>
          </div>
        </div>

        <div>
          <SectionHeader title="Events" />
          <div className="py-10 flex flex-col items-center justify-center border border-dashed border-border-primary-light rounded-xl bg-surface-secondary/30 text-center">
            <div className="w-10 h-10 bg-surface-primary rounded-full flex items-center justify-center border border-border-primary-light mb-3">
              <Activity width={18} height={18} className="text-content-tertiary" />
            </div>
            <p className="text-sm font-semibold text-content-primary">No events yet</p>
            <p className="text-xs text-content-tertiary max-w-52 mt-1 leading-relaxed">
              Events like authorization requests and status changes will appear here.
            </p>
          </div>
        </div>
      </section>
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
          <Skeleton className="h-3.5 w-36" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>

      {/* Overview strip */}
      <div className="bg-surface-primary border border-border-primary-light rounded-xl flex flex-col md:flex-row">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-5 py-3.5 md:flex-1 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Recent cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded" />
        ))}
      </div>

      {/* Config sections */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-3 gap-x-8 gap-y-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

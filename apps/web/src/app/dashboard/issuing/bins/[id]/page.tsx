'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  MoreVertical,
  Settings,
} from 'lucide-react'
import { Button, Skeleton } from '@/lib/pax'
import { useIssuingNav } from '@/context/IssuingNavContext'
import { useCardBinControllerGet } from '@/api/card-bins/card-bins'
import { useCardProgramControllerGetCardPrograms } from '@/api/card-programs/card-programs'
import { formatDatetime } from '@/lib/format'
import { Badge } from '@/components/ui/Badge'
import { NetworkBadge } from '@/components/ui/NetworkBadge'
import { DataTable } from '@/components/ui/DataTable'
import { Currency } from '@/components/ui/Currency'
import {
  CopyValue,
  OverviewCell,
  SectionHeader,
} from '@/components/ui/DetailPage'

const BIN_LENGTH_LABELS: Record<string, string> = {
  six: '6 digits',
  eight: '8 digits',
}

const BIN_PROVIDER_LABELS: Record<string, string> = {
  providus: 'Providus Bank',
}

// ── Empty ─────────────────────────────────────────────────────────────────────
// Muted inline text for missing values inside overview cells.

function Empty({ children }: { children: React.ReactNode }) {
  return <span className="text-content-tertiary">{children}</span>
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BinDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { setPageTitle } = useIssuingNav()

  const [programsCursor, setProgramsCursor] = useState<{ before?: string; after?: string }>({})

  const { data: binRes, isLoading: isLoadingBin, error: binError } = useCardBinControllerGet(id, undefined)
  const bin = (binRes?.data as any) || null

  const { data: programsRes, isLoading: isLoadingPrograms } =
    useCardProgramControllerGetCardPrograms({ filter: `bin:${id}`, limit: 10, sort: 'createdAt_desc' as any, ...programsCursor } as any)
  const programs = (programsRes?.data as any) || []
  const programsHasMore = (programsRes as any)?.metadata?.hasMore ?? false

  useEffect(() => {
    if (bin?.name) setPageTitle(bin.name)
    return () => setPageTitle(null)
  }, [bin?.name, setPageTitle])

  if (isLoadingBin) return <DetailSkeleton />
  if (binError || !bin)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-feedback-danger-subtle text-feedback-danger-main rounded-full flex items-center justify-center">
          <AlertCircle width={32} height={32} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-content-primary">BIN not found</h3>
          <p className="text-content-tertiary max-w-64 mx-auto">
            We couldn&apos;t retrieve the details for this BIN. It may have been archived
            or the ID is incorrect.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()} className="gap-2 cursor-pointer">
          <ArrowLeft width={16} height={16} /> Back to BINs
        </Button>
      </div>
    )

  const binReference = bin.id?.includes('_') ? bin.id.split('_')[1] : null
  const lengthLabel = bin.binLength ? BIN_LENGTH_LABELS[bin.binLength] ?? bin.binLength : null
  const providerLabel = bin.provider ? BIN_PROVIDER_LABELS[bin.provider] ?? bin.provider : null

  return (
    <div className="animate-in fade-in duration-300 pb-16 space-y-8">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-content-primary tracking-tight">
              {bin.name}
            </h1>
            <Badge variant="status" value={bin.status} />
          </div>
          <CopyValue value={bin.id} />
        </div>

        {/**
         *  <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            color="secondary"
            size="sm"
            className="gap-1.5 cursor-pointer"
          >
            <Settings width={14} height={14} /> Manage bin
          </Button>
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
         * 
         */}
       
      </div>

      {/* ── Overview strip ──────────────────────────────────────────────────── */}
      <div className="bg-surface-primary border border-border-primary-light rounded-xl flex flex-col md:flex-row">
        <OverviewCell label="Network">
          {bin.network ? (
            <NetworkBadge value={bin.network} showLabel />
          ) : (
            <Empty>No network</Empty>
          )}
        </OverviewCell>
        <OverviewCell label="Provider bank">
          {providerLabel ? (
            <span className="truncate block">{providerLabel}</span>
          ) : (
            <Empty>No provider</Empty>
          )}
        </OverviewCell>
        <OverviewCell label="BIN reference">
          {binReference ? (
            <CopyValue value={binReference} />
          ) : (
            <Empty>Not provisioned</Empty>
          )}
        </OverviewCell>
        <OverviewCell label="Length">
          {lengthLabel ? (
            <span className="tabular-nums">{lengthLabel}</span>
          ) : (
            <Empty>No length</Empty>
          )}
        </OverviewCell>
        <OverviewCell label="Type">
          {bin.type ? (
            <Badge variant="type" value={bin.type} />
          ) : (
            <Empty>No type</Empty>
          )}
        </OverviewCell>
        <OverviewCell label="Created">
          <span className="tabular-nums">{formatDatetime(bin.createdAt)}</span>
        </OverviewCell>
      </div>

      {/* ── Linked card programs ────────────────────────────────────────────── */}
      <div>
        <SectionHeader title="Linked card programs" />
        <DataTable
          data={programs}
          columns={[
            {
              header: 'Program name',
              render: (p: any) => (
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-content-primary group-hover:text-action-primary-main transition-colors">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-content-tertiary font-mono italic">
                    {p.id}
                  </span>
                </div>
              ),
            },
            { header: 'Type', render: (p: any) => <Badge variant="type" value={p.type} /> },
            { header: 'Currency', render: (p: any) => <Currency code={p.currency} /> },
            {
              header: 'Status',
              render: (p: any) => <Badge variant="status" value={p.status} />,
            },
          ]}
          isLoading={isLoadingPrograms}
          resourceName="Card programs"
          onRowClick={(row) => router.push(`/dashboard/issuing/card-programs/${row.id}`)}
          pagination={{
            hasMore: programsHasMore,
            hasPrevious: !!(programsCursor.before || programsCursor.after),
            onPageChange: (type, val) => setProgramsCursor({ [type]: val }),
          }}
          emptyState={{
            title: 'No linked card programs',
            description:
              'No issuing programs have been assigned to this BIN inventory yet.',
            icon: <Activity width={24} height={24} />,
          }}
        />
      </div>
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

      {/* Linked card programs */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-14 w-full rounded" />
        <Skeleton className="h-14 w-full rounded" />
      </div>
    </div>
  )
}

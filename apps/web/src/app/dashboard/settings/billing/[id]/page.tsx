'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AlertCircle, ArrowLeft, Download, Receipt } from 'lucide-react'
import { Button, Skeleton } from '@/lib/pax'
import { useBillingControllerGetOne } from '@/api/billings/billings'
import { useMode } from '@/context/ModeContext'
import { type ApiHydratedBilling, type BillingItem } from '@/api/model'
import { formatAmount, formatDate, formatDatetime } from '@/lib/format'
import { Badge } from '@/components/ui/Badge'
import { PayInvoiceModal } from '@/components/ui/PayInvoiceModal'
import {
  CopyValue,
  OverviewCell,
  SectionHeader,
} from '@/components/ui/DetailPage'
import { useIssuingNav } from '@/context/IssuingNavContext'

function Empty({ children }: { children: React.ReactNode }) {
  return <span className="text-content-tertiary">{children}</span>
}

function unSlugify(str: string | undefined) {
  if (!str) return '—'
  return str.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// Mock invoice for UI previews on environments without real billing data.
// Hit /dashboard/settings/billing/preview to render it.
const MOCK_INVOICE: ApiHydratedBilling = {
  id: 'preview',
  invoiceNo: 'INV-2026-04-0001',
  period: '2026-04',
  listAmount: 1_250_000_00,
  billedAmount: 1_125_000_00,
  dueDate: '2026-05-15',
  currency: 'NGN',
  status: 'due' as any,
  createdAt: '2026-04-01T09:00:00.000Z',
  updatedAt: '2026-04-01T09:00:00.000Z',
  items: [
    {
      billable: 'card-issuance',
      productRef: 'PRD_ISSUE_001',
      quantity: 450,
      unit: 'per_card' as any,
      unitPrice: 1_500_00,
      billablePrice: 675_000_00,
    },
    {
      billable: 'active-cards',
      productRef: 'PRD_ACTIVE_002',
      quantity: 1_280,
      unit: 'per_card_month' as any,
      unitPrice: 250_00,
      billablePrice: 320_000_00,
    },
    {
      billable: 'authorization-requests',
      productRef: 'PRD_AUTH_003',
      quantity: 42_500,
      unit: 'per_request' as any,
      unitPrice: 6_00,
      billablePrice: 255_000_00,
    },
  ] as any,
}

export default function BillingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { isSandboxMode } = useMode()
  const { setPageTitle } = useIssuingNav()
  const [payModalOpen, setPayModalOpen] = useState(false)

  useEffect(() => {
    if (isSandboxMode) router.replace('/dashboard')
  }, [isSandboxMode, router])

  const isPreview = id === 'preview'
  const { data: invoiceRes, isLoading: isLoadingReal, error: realError } = useBillingControllerGetOne(
    id,
    undefined,
    { query: { enabled: !isPreview } } as any,
  )
  const invoice: ApiHydratedBilling | null = isPreview
    ? MOCK_INVOICE
    : ((invoiceRes?.data as any) ?? null)
  const isLoading = isPreview ? false : isLoadingReal
  const error = isPreview ? null : realError

  useEffect(() => {
    if (invoice?.invoiceNo) setPageTitle(invoice.invoiceNo)
    return () => setPageTitle(null)
  }, [invoice?.invoiceNo, setPageTitle])

  if (isLoading) return <DetailSkeleton />

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-feedback-danger-subtle text-feedback-danger-main rounded-full flex items-center justify-center">
          <AlertCircle width={32} height={32} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-content-primary">Invoice not found</h3>
          <p className="text-content-tertiary max-w-64 mx-auto">
            {(error as any)?.message ?? 'This invoice could not be loaded. It may have been archived or the ID is incorrect.'}
          </p>
        </div>
        <Button
          variant="outline"
          color="secondary"
          onClick={() => router.push('/dashboard/settings/billing')}
          className="gap-2 cursor-pointer"
        >
          <ArrowLeft width={16} height={16} /> Back to billing
        </Button>
      </div>
    )
  }

  const pdfUrl = invoice.invoicePdf
    ? (invoice.invoicePdf as any).url ?? (invoice.invoicePdf as any).Location
    : null
  const canPay = invoice.status !== 'paid' && invoice.status !== 'pending'
  const hasDiscount = invoice.listAmount !== invoice.billedAmount

  return (
    <div className="animate-in fade-in duration-300 pb-16 space-y-8">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-content-primary tracking-tight font-mono">
              {invoice.invoiceNo}
            </h1>
            <Badge variant="status" value={invoice.status} />
          </div>
          <CopyValue value={invoice.id} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {pdfUrl && (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" color="secondary" size="sm" className="gap-1.5 cursor-pointer">
                <Download width={14} height={14} /> Download PDF
              </Button>
            </a>
          )}
          {canPay && (
            <Button
              color="primary"
              size="sm"
              className="gap-1.5 cursor-pointer"
              onClick={() => setPayModalOpen(true)}
            >
              <Receipt width={14} height={14} /> Pay via transfer
            </Button>
          )}
        </div>
      </div>

      {/* ── Overview strip ──────────────────────────────────────────────────── */}
      <div className="bg-surface-primary border border-border-primary-light rounded-xl flex flex-col md:flex-row">
        <OverviewCell label="Amount due">
          <span className="tabular-nums font-semibold">
            {formatAmount(invoice.billedAmount, invoice.currency)}
          </span>
        </OverviewCell>
        <OverviewCell label="Due date">
          <span className="tabular-nums">{formatDate(invoice.dueDate)}</span>
        </OverviewCell>
        <OverviewCell label="Billing period">
          {invoice.period ? <span>{invoice.period}</span> : <Empty>No period</Empty>}
        </OverviewCell>
        <OverviewCell label="Currency">{invoice.currency}</OverviewCell>
        <OverviewCell label="Line items">
          <span className="tabular-nums">{invoice.items.length.toLocaleString()}</span>
        </OverviewCell>
        <OverviewCell label="Created">
          <span className="tabular-nums">{formatDatetime(invoice.createdAt)}</span>
        </OverviewCell>
      </div>

      {/* ── Invoice items ───────────────────────────────────────────────────── */}
      <div>
        <SectionHeader title="Invoice items" />

        {invoice.items.length === 0 ? (
          <p className="text-sm text-content-tertiary py-4">No line items.</p>
        ) : (
          <>
            <div className="rounded-xl border border-border-primary-light overflow-hidden bg-surface-primary">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-secondary border-b border-border-primary-light">
                    <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-content-tertiary">
                      Description
                    </th>
                    <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-content-tertiary">
                      Qty
                    </th>
                    <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-content-tertiary">
                      Unit
                    </th>
                    <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-content-tertiary">
                      Unit price
                    </th>
                    <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-content-tertiary">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item: BillingItem, idx: number) => (
                    <tr
                      key={idx}
                      className="border-b border-border-primary-light last:border-0 hover:bg-surface-secondary transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <div className="text-sm font-medium text-content-primary">
                          {unSlugify(item.billable)}
                        </div>
                        <div className="text-xs text-content-tertiary font-mono mt-0.5">
                          {item.productRef}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-content-secondary">
                        {item.quantity.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right text-content-secondary capitalize">
                        {item.unit?.replace(/_/g, ' ') ?? '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-content-secondary">
                        {formatAmount(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-content-primary">
                        {formatAmount(item.billablePrice, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals block */}
            <div className="flex justify-end pt-4">
              <div className="w-full sm:w-80 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-content-tertiary">Subtotal</span>
                  <span className="tabular-nums text-content-secondary">
                    {formatAmount(invoice.listAmount, invoice.currency)}
                  </span>
                </div>
                {hasDiscount && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-content-tertiary">Discount</span>
                    <span className="tabular-nums text-feedback-success-dark">
                      −{formatAmount(invoice.listAmount - invoice.billedAmount, invoice.currency)}
                    </span>
                  </div>
                )}
                <div className="border-t border-border-primary-light pt-3 flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-content-primary">Total due</span>
                  <span className="text-xl font-semibold tabular-nums text-content-primary">
                    {formatAmount(invoice.billedAmount, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {payModalOpen && (
        <PayInvoiceModal
          invoiceNo={invoice.invoiceNo}
          amount={invoice.billedAmount}
          currency={invoice.currency}
          onClose={() => setPayModalOpen(false)}
        />
      )}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="pb-16 space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-3.5 w-36" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>
      </div>

      <div className="bg-surface-primary border border-border-primary-light rounded-xl flex flex-col md:flex-row">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-5 py-3.5 md:flex-1 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-14 w-full rounded" />
        <Skeleton className="h-14 w-full rounded" />
        <Skeleton className="h-14 w-full rounded" />
      </div>
    </div>
  )
}

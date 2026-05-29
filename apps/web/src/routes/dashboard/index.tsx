'use client'

import { useState } from 'react'
import { useDashboardControllerGetMetrics } from '@/api/dashboard/dashboard'
import { useBusinessControllerFind } from '@/api/business/business'
import { useAuth } from '@/context/AuthContext'
import { Sparkline } from '@/components/ui/Sparkline'
import { Delta } from '@/components/ui/Delta'
import { ChartEmpty } from '@/components/ui/ChartEmpty'
import { StatValue } from '@/components/ui/StatValue'
import { PeriodSelect, PERIODS, type Period } from '@/components/ui/PeriodSelect'
import { formatAmount } from '@/lib/format'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

// ─── Helpers ────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatSparklineDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatStatusLabel(status: string) {
  return status
    .split(/[-_]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function compactAmount(kobo: number, currency = 'NGN') {
  const naira = kobo / 100
  if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(1)}M`
  if (naira >= 1_000) return `₦${(naira / 1_000).toFixed(0)}K`
  return formatAmount(kobo, currency)
}

// ─── Chart palette — data viz exception ─────────────────────────────────────

const FLOW_COLORS = ['#3EB4FF', '#43C66A'] // pay-in, pay-out

const STATUS_COLORS = [
  'var(--forest-green-500)',
  'var(--golden-yellow-500)',
  'var(--fire-red-500)',
]

// ─── Sub-components ─────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = (v: unknown) => String(v),
}: {
  active?: boolean
  payload?: any[]
  label?: string
  valueFormatter?: (v: any) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-primary border border-border-primary-light rounded-xl px-3 py-2 shadow-sm">
      {label && (
        <div className="text-sm font-medium text-content-primary mb-1.5">{label}</div>
      )}
      <div className="space-y-1">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span
              className="w-2 h-2 rounded-sm shrink-0"
              style={{ backgroundColor: entry.color ?? entry.fill ?? entry.payload?.fill }}
            />
            {entry.name && (
              <span className="text-content-tertiary">{entry.name}</span>
            )}
            <span className="tabular-nums font-medium text-content-primary ml-auto pl-3">
              {valueFormatter(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChartCard({
  label,
  hero,
  subvalue,
  children,
  className,
}: {
  label: string
  hero?: React.ReactNode
  subvalue?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={[
        'bg-surface-primary border border-border-primary-light rounded-xl overflow-hidden h-full flex flex-col',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {hero ? (
        <div className="px-5 pt-5 pb-3">
          <div className="text-xs font-medium text-content-tertiary mb-2">{label}</div>
          <div className="text-2xl font-semibold text-content-primary tabular-nums leading-none">{hero}</div>
          {subvalue && (
            <div className="text-xs font-medium text-content-tertiary mt-1.5">{subvalue}</div>
          )}
        </div>
      ) : (
        <div className="px-4 py-3 border-b border-border-primary-light">
          <span className="text-xs font-semibold text-content-tertiary uppercase tracking-[0.06em]">
            {label}
          </span>
        </div>
      )}
      <div className={`flex flex-col flex-1 min-h-0 ${hero ? 'px-4 pb-4' : 'p-4'}`}>{children}</div>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function Home() {
  const { user } = useAuth()
  const { data: bizData } = useBusinessControllerFind()
  const businessName = (bizData as any)?.data?.name || (user as any)?.business?.name || ''
  const [period, setPeriod] = useState<Period>('7d')

  const { data: metricsRaw } = useDashboardControllerGetMetrics({ period })
  const metrics = (metricsRaw as any)?.data
  const currency = metrics?.currency ?? 'NGN'

  const collectionsTotal = metrics?.collections?.total ?? 0
  const collectionsTrend: number | null = metrics?.collections?.change ?? null
  const volumeSparkline = (metrics?.dailyCollections ?? []).map(d => ({
    day: formatSparklineDate(d.date),
    value: d.total,
  }))

  const payInCount = metrics?.payIns?.count ?? 0
  const payInFailures = metrics?.payInFailures?.count ?? 0
  const successPct = metrics?.successRate?.rate ?? 0
  const payInDelta: number | null = metrics?.payIns?.change ?? null
  const failureDelta: number | null = metrics?.payInFailures?.change ?? null
  const successDelta: number | null = metrics?.successRate?.change ?? null

  const flowData = (metrics?.flowSplit ?? []).map((f, i) => ({
    name: f.name,
    value: f.percent,
    color: FLOW_COLORS[i % FLOW_COLORS.length],
  }))
  const flowHasData = flowData.some(f => f.value > 0)

  const statusStats = metrics?.byStatus ?? []
  const statusTotal = statusStats.reduce((s, d) => s + d.count, 0)

  const availableBalance = metrics?.availableBalance ?? 0
  const pendingPayout = metrics?.pendingPayout ?? 0

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-content-primary leading-snug">
            {getGreeting()}, {businessName}
          </h1>
          <p className="text-sm text-content-tertiary mt-1">
            Here&apos;s what&apos;s happening across your treasury today.
          </p>
        </div>
        <PeriodSelect value={period} onChange={setPeriod} />
      </div>

      {/* ── Row 1 — Collections volume + pay-in stats ───────────────────────── */}
      <div className="bg-surface-primary border border-border-primary-light rounded-xl overflow-hidden flex flex-col md:flex-row">
        <div className="flex-2 pt-5 pl-5 pr-0 pb-0 flex flex-col min-h-0">
          <StatValue
            label={`Collections · ${PERIODS.find(p => p.value === period)?.label.toLowerCase()}`}
            value={compactAmount(collectionsTotal, currency)}
            size="lg"
            delta={collectionsTrend !== null ? <Delta value={collectionsTrend} /> : undefined}
          />
          <div className="mt-3 -ml-5 flex-1 min-h-0">
            <Sparkline
              data={volumeSparkline}
              dataKey="value"
              height="100%"
              seriesLabel="Collections"
              valueFormatter={(v) => compactAmount(Number(v), currency)}
              emptyFallbackHeight={140}
            />
          </div>
        </div>

        <div className="h-px md:h-auto md:w-px bg-border-primary-light shrink-0" />

        <div className="flex-1 flex flex-col justify-center divide-y divide-border-primary-light">
          {[
            { label: 'Successful pay-ins', value: payInCount.toLocaleString(), delta: payInDelta, positiveIsGood: true },
            { label: 'Failed pay-ins', value: payInFailures.toLocaleString(), delta: failureDelta, positiveIsGood: false },
            { label: 'Success rate', value: `${successPct}%`, delta: successDelta, positiveIsGood: true },
          ].map(({ label, value, delta, positiveIsGood }) => (
            <div key={label} className="px-6 py-4">
              <div className="text-xs font-medium text-content-tertiary mb-2">{label}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-md font-medium text-content-primary tabular-nums">{value}</span>
                {delta !== null && <Delta value={delta} positiveIsGood={positiveIsGood} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 2 — Flow split, status breakdown, balances ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <ChartCard
          label="Pay-in vs pay-out"
          hero={flowData[0] && flowHasData ? `${flowData[0].name} · ${flowData[0].value}%` : 'No activity'}
          subvalue={flowData.slice(1).map(c => `${c.name} ${c.value}%`).join(' · ') || undefined}
        >
          {!flowHasData ? (
            <ChartEmpty variant="donut" height={216} />
          ) : (
            <ResponsiveContainer width="100%" height={216}>
              <PieChart>
                <Pie
                  data={flowData}
                  cx="50%"
                  cy="42%"
                  innerRadius={52}
                  outerRadius={74}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {flowData.map((entry, i) => (
                    <Cell key={entry.name} fill={entry.color ?? FLOW_COLORS[i % FLOW_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip valueFormatter={(v) => `${v}%`} />} />
                <Legend
                  content={({ payload }) => (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 4 }}>
                      {payload?.map((entry, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 4, backgroundColor: entry.color, flexShrink: 0, display: 'inline-block' }} />
                          <span style={{ fontSize: 12, color: 'var(--color-content-tertiary)' }}>{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <div className="bg-surface-primary border border-border-primary-light rounded-xl overflow-hidden h-full flex flex-col">
          <div className="px-5 pt-5 pb-3">
            <StatValue
              label="Payments by status"
              value={statusTotal.toLocaleString()}
              size="lg"
              caption={statusStats[0] ? `${formatStatusLabel(statusStats[0].status)} ${statusStats[0].percent}%` : undefined}
            />
          </div>
          {statusStats.length === 0 || statusTotal === 0 ? (
            <div className="px-4 pb-4 flex-1 flex items-center">
              <ChartEmpty variant="bars" orientation="horizontal" accent="#3EB4FF" height={120} />
            </div>
          ) : (
            <>
              <div className="flex h-5 mx-4 mt-4 rounded overflow-hidden gap-px bg-surface-primary">
                {statusStats.map(({ status, percent }, i) => (
                  <div
                    key={status}
                    style={{ width: `${percent}%`, backgroundColor: STATUS_COLORS[i % STATUS_COLORS.length] }}
                  />
                ))}
              </div>
              <div className="px-4 pt-3 pb-4">
                {statusStats.map(({ status, percent, count }, i) => (
                  <div key={status} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded shrink-0"
                        style={{ backgroundColor: STATUS_COLORS[i % STATUS_COLORS.length] }}
                      />
                      <span className="text-sm text-content-secondary">{formatStatusLabel(status)}</span>
                    </div>
                    <span className="text-sm font-medium tabular-nums text-content-primary">
                      {count.toLocaleString()} · {percent}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-surface-primary border border-border-primary-light rounded-xl overflow-hidden h-full flex flex-col justify-center divide-y divide-border-primary-light">
          {[
            { label: 'Available balance', value: formatAmount(availableBalance, currency) },
            { label: 'Pending payout', value: formatAmount(pendingPayout, currency) },
          ].map(({ label, value }) => (
            <div key={label} className="px-6 py-6">
              <div className="text-xs font-medium text-content-tertiary mb-2">{label}</div>
              <div className="text-2xl font-semibold text-content-primary tabular-nums leading-none">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

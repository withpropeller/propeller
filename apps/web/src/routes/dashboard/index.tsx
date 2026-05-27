'use client'

import { useState } from 'react'
import { useCardAuthorizationControllerGetMetrics } from '@/api/card-authorizations/card-authorizations'
import { useBusinessControllerFind } from '@/api/business/business'
import { useAuth } from '@/context/AuthContext'
import { Sparkline } from '@/components/ui/Sparkline'
import { Delta } from '@/components/ui/Delta'
import { ChartEmpty } from '@/components/ui/ChartEmpty'
import { StatValue } from '@/components/ui/StatValue'
import { PeriodSelect, PERIODS, type Period } from '@/components/ui/PeriodSelect'
import {
  BarChart,
  Bar,
  LabelList,
  PieChart,
  Pie,
  Cell,
  XAxis,
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




function formatVolume(v: number) {
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `₦${(v / 1_000).toFixed(0)}K`
  return `₦${v}`
}

function normalizeReason(reason: string) {
  return reason
    .split(/[-_]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function formatSparklineDate(iso: string) {
  // Append time to prevent UTC-to-local timezone shift on date-only strings
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Chart palette — data viz exception (no semantic tokens for chart series) ─

const CHANNEL_COLORS = ['#3EB4FF', '#EC85C7', '#43C66A'] // deep-sky-500, fuschia-500, forest-green-500

const DECLINE_COLORS = [
  'var(--fire-red-500)',
  'var(--golden-yellow-500)',
  'var(--fuschia-500)',
  'var(--burnt-orange-500)',
]

const TICK_STYLE = { fontSize: 12, fontWeight: 500, fill: 'var(--color-content-tertiary)' }

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

// ─── Spend by category — Option A: vertical bar chart ───────────────────────

function TwoLineTick({ x, y, payload }: any) {
  const words = (payload.value as string).split(' ')
  const mid = Math.ceil(words.length / 2)
  const line1 = words.slice(0, mid).join(' ')
  const line2 = words.slice(mid).join(' ')
  return (
    <text x={x} y={y} textAnchor="middle" fill="var(--color-content-tertiary)" fontSize={12} fontWeight={500}>
      <tspan x={x} dy="0.8em">{line1}</tspan>
      {line2 && <tspan x={x} dy="1.2em">{line2}</tspan>}
    </text>
  )
}

function SpendBarsChart({ data }: { data: { category: string; amount: number }[] }) {
  // Deep-sky-500 (#3EB4FF) — Recharts SVG fill doesn't support CSS vars
  const BAR_COLOR = '#3EB4FF'
  if (data.length === 0) {
    return (
      <div className="-mb-4 flex-1 min-h-0 flex items-end">
        <div className="w-full">
          <ChartEmpty
            variant="bars"
            accent={BAR_COLOR}
            height={180}
          />
        </div>
      </div>
    )
  }
  return (
    <div className="-mx-4 -mb-4 flex-1 min-h-0">
      <div style={{ width: data.length > 0 && data.length <= 3 ? `${data.length * 150}px` : '100%', height: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 24, right: 32, left: 32, bottom: 8 }}
            barCategoryGap="20%"
          >
            <XAxis
              dataKey="category"
              tick={<TwoLineTick />}
              axisLine={false}
              tickLine={false}
              interval={0}
              height={48}
            />
            <Tooltip content={<ChartTooltip valueFormatter={formatVolume} />} cursor={false} />
            <Bar dataKey="amount" name="Spend" fill={BAR_COLOR} radius={[8, 8, 0, 0]} maxBarSize={64}>
              <LabelList
                dataKey="amount"
                position="top"
                formatter={formatVolume}
                style={{ fontSize: 10, fill: 'var(--color-content-tertiary)' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Chart card ──────────────────────────────────────────────────────────────

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

  const { data: metricsRaw } = useCardAuthorizationControllerGetMetrics({ period })
  const metrics = (metricsRaw as any)?.data

  // ── Volume ────────────────────────────────────────────────────────────────
  const volumeTotal     = metrics?.volume?.total ?? 0
  const volumeTrend: number | null = metrics?.volume?.change ?? null
  const volumeSparkline = ((metrics?.dailyVolume ?? []) as { date: string; total: number }[]).map(d => ({
    day: formatSparklineDate(d.date),
    value: d.total,
  }))

  // ── Auth stats ────────────────────────────────────────────────────────────
  const authApproved      = metrics?.approved?.count ?? 0
  const authDeclined      = metrics?.declined?.count ?? 0
  const authSuccessPct    = metrics?.successRate?.rate ?? 0
  const authApprovedDelta: number | null = metrics?.approved?.change ?? null
  const authDeclinedDelta: number | null = metrics?.declined?.change ?? null
  const authSuccessDelta: number | null  = metrics?.successRate?.change ?? null

  // ── Channel split ──────────────────────────────────────────────────────────
  const channelEntries = Object.entries(
    (metrics?.channels ?? {}) as Record<string, { count: number; total: number }>,
  )
  const channelCountTotal = channelEntries.reduce((s, [, v]) => s + v.count, 0)
  const channelData = channelEntries.map(([name, v]) => ({
    name: normalizeReason(name),
    value: channelCountTotal > 0 ? Math.round((v.count / channelCountTotal) * 100) : 0,
  }))

  // ── Spend by category ─────────────────────────────────────────────────────
  const categoryData = ((metrics?.spendByCategory ?? []) as { category: string; total: number }[]).map(d => ({
    category: normalizeReason(d.category),
    amount: d.total,
  }))
  const categoryTotal = categoryData.reduce((s, d) => s + d.amount, 0)

  // ── Decline reasons ────────────────────────────────────────────────────────
  const declineReasons = ((metrics?.declineReasons ?? []) as { reason: string; percent: number }[]).map(
    (d, i) => ({ reason: normalizeReason(d.reason), pct: d.percent, color: DECLINE_COLORS[i % DECLINE_COLORS.length] }),
  )

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-content-primary leading-snug">
            {getGreeting()}, {businessName}
          </h1>
          <p className="text-sm text-content-tertiary mt-1">
            Here's what's happening across your treasury today.
          </p>
        </div>
        <PeriodSelect value={period} onChange={setPeriod} />
      </div>

      {/* ── Row 1 — Transaction volume card (full width, sparkline left + stats right) */}
      <div className="bg-surface-primary border border-border-primary-light rounded-xl overflow-hidden flex flex-col md:flex-row">
        {/* Left column — label, value, trend, sparkline */}
        <div className="flex-2 pt-5 pl-5 pr-0 pb-0 flex flex-col min-h-0">
          <StatValue
            label={`Transaction volume · ${PERIODS.find(p => p.value === period)?.label.toLowerCase()}`}
            value={formatVolume(volumeTotal)}
            size="lg"
            delta={volumeTrend !== null ? <Delta value={volumeTrend} /> : undefined}
          />
          {/* Sparkline fills remaining height, bleeds to left edge (-ml-5 cancels pl-5) */}
          <div className="mt-3 -ml-5 flex-1 min-h-0">
            <Sparkline
              data={volumeSparkline}
              dataKey="value"
              height="100%"
              seriesLabel="Volume"
              valueFormatter={formatVolume}
              emptyFallbackHeight={140}
            />
          </div>
        </div>

        {/* Vertical divider */}
        <div className="h-px md:h-auto md:w-px bg-border-primary-light shrink-0" />

        {/* Right column — Approved / Declined / Success rate, no color coding */}
        <div className="flex-1 flex flex-col justify-center divide-y divide-border-primary-light">
          {[
            { label: 'Approved',     value: authApproved.toLocaleString(), delta: authApprovedDelta, positiveIsGood: true  },
            { label: 'Declined',     value: authDeclined.toLocaleString(), delta: authDeclinedDelta, positiveIsGood: false },
            { label: 'Success rate', value: `${authSuccessPct}%`,          delta: authSuccessDelta,  positiveIsGood: true  },
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

      {/* ── Row 2 — Spend by category + Channel split + Top decline reasons ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
        <div className="lg:col-span-2 h-full">
          <ChartCard
            label="Spend by category"
            hero={formatVolume(categoryTotal)}
            subvalue={categoryData[0] ? `${categoryData[0].category} leads at ${formatVolume(categoryData[0].amount)}` : undefined}
          >
            <SpendBarsChart data={categoryData} />
          </ChartCard>
        </div>

        {/* Channel split donut */}
        <ChartCard
          label="Channel split"
          hero={channelData[0] ? `${channelData[0].name} · ${channelData[0].value}%` : '0 channels'}
          subvalue={channelData.slice(1).map(c => `${c.name} ${c.value}%`).join(' · ') || undefined}
        >
          {channelData.length === 0 ? (
            <ChartEmpty
              variant="donut"
              height={216}
            />
          ) : (
            <ResponsiveContainer width="100%" height={216}>
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="42%"
                  innerRadius={52}
                  outerRadius={74}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {channelData.map((_, i) => (
                    <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
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
              label="Top decline reasons"
              value={authDeclined.toLocaleString()}
              size="lg"
              caption={declineReasons[0] ? `${declineReasons[0].reason} ${declineReasons[0].pct}%` : undefined}
            />
          </div>
          {declineReasons.length === 0 ? (
            <div className="px-4 pb-4 flex-1 flex items-center">
              <ChartEmpty
                variant="bars"
                orientation="horizontal"
                accent="#EC85C7"
                height={120}
              />
            </div>
          ) : (
            <>
              {/* Segmented stacked bar */}
              <div className="flex h-5 mx-4 mt-4 rounded overflow-hidden gap-px bg-surface-primary">
                {declineReasons.map(({ reason, pct, color }) => (
                  <div key={reason} style={{ width: `${pct}%`, backgroundColor: color }} />
                ))}
              </div>
              {/* List */}
              <div className="px-4 pt-3 pb-4">
                {declineReasons.map(({ reason, pct, color }) => (
                  <div key={reason} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-sm text-content-secondary">{reason}</span>
                    </div>
                    <span className="text-sm font-medium tabular-nums text-content-primary">{pct}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

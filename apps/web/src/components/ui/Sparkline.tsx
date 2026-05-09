'use client'

import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartEmpty } from './ChartEmpty'

// Sky blue — data viz exception (no semantic token for chart series color)
const SPARKLINE_BLUE = '#38bdf8'

function SparkTooltip({
  active,
  payload,
  label,
  seriesLabel = 'USDC',
  valueFormatter,
}: {
  active?: boolean
  payload?: any[]
  label?: string
  seriesLabel?: string
  valueFormatter?: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div className="bg-surface-primary border border-border-primary-light rounded-xl px-3 py-2 shadow-sm">
      <div className="text-sm font-medium text-content-primary mb-1">{label}</div>
      <div className="flex items-center gap-1.5 text-xs">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: SPARKLINE_BLUE }}
        />
        <span className="text-content-tertiary">{seriesLabel}</span>
        <span className="tabular-nums font-medium text-content-primary">
          {valueFormatter ? valueFormatter(val) : val.toLocaleString()}
        </span>
      </div>
    </div>
  )
}

interface SparklineProps {
  data: Array<{ day: string; value: number }>
  dataKey?: string
  height?: number | string
  stroke?: string
  fill?: string
  /** Label shown next to the dot in the hover tooltip (default: 'USDC') */
  seriesLabel?: string
  /** Formats the tooltip value; defaults to toLocaleString() */
  valueFormatter?: (v: number) => string
  /** Empty-state copy. Name the gate — e.g. "Trend appears after the first authorisation." */
  emptyTitle?: string
  emptyHint?: string
  /** Pixel height used by the empty state when `height` is "100%". */
  emptyFallbackHeight?: number
}

export function Sparkline({
  data,
  dataKey = 'value',
  height = 90,
  seriesLabel = 'USDC',
  valueFormatter,
  emptyTitle,
  emptyHint,
  emptyFallbackHeight = 90,
}: SparklineProps) {
  if (!data || data.length === 0) {
    const px = height === '100%' ? emptyFallbackHeight : (typeof height === 'number' ? height : emptyFallbackHeight)
    return (
      <div className="w-full h-full flex items-center" style={{ minHeight: px }}>
        <div className="w-full">
          <ChartEmpty variant="sparkline" title={emptyTitle} hint={emptyHint} accent={SPARKLINE_BLUE} height={px} />
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SPARKLINE_BLUE} stopOpacity={0.18} />
            <stop offset="100%" stopColor={SPARKLINE_BLUE} stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* Hidden axis so Recharts uses the "day" field as the tooltip label */}
        <XAxis dataKey="day" hide />
        <Tooltip
          content={
            <SparkTooltip
              seriesLabel={seriesLabel}
              valueFormatter={valueFormatter}
            />
          }
          cursor={false}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={SPARKLINE_BLUE}
          strokeWidth={1.5}
          fill="url(#sparkline-gradient)"
          dot={false}
          activeDot={{ r: 4, fill: SPARKLINE_BLUE, stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

function formatSparklineDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6']

export default function DashboardIndexPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [period, setPeriod] = useState<Period>(PERIODS[0]!)

  // Placeholder — real data hooks will be wired up when the API layer is ready
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-content-primary">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-sm text-content-secondary mt-1">
            Here's what's happening with your account today.
          </p>
        </div>
        <PeriodSelect value={period} onChange={setPeriod} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-primary border border-border-primary-light rounded-xl p-5">
          <p className="text-xs font-medium text-content-tertiary uppercase tracking-wider">Total Volume</p>
          <StatValue className="mt-2">—</StatValue>
          <Delta className="mt-1">No data yet</Delta>
        </div>
        <div className="bg-surface-primary border border-border-primary-light rounded-xl p-5">
          <p className="text-xs font-medium text-content-tertiary uppercase tracking-wider">Transactions</p>
          <StatValue className="mt-2">—</StatValue>
          <Delta className="mt-1">No data yet</Delta>
        </div>
        <div className="bg-surface-primary border border-border-primary-light rounded-xl p-5">
          <p className="text-xs font-medium text-content-tertiary uppercase tracking-wider">Active Cards</p>
          <StatValue className="mt-2">—</StatValue>
          <Delta className="mt-1">No data yet</Delta>
        </div>
        <div className="bg-surface-primary border border-border-primary-light rounded-xl p-5">
          <p className="text-xs font-medium text-content-tertiary uppercase tracking-wider">Success Rate</p>
          <StatValue className="mt-2">—</StatValue>
          <Delta className="mt-1">No data yet</Delta>
        </div>
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-primary border border-border-primary-light rounded-xl p-6">
          <h3 className="text-sm font-semibold text-content-primary mb-4">Transaction Volume</h3>
          <ChartEmpty message="No transaction data for this period." />
        </div>
        <div className="bg-surface-primary border border-border-primary-light rounded-xl p-6">
          <h3 className="text-sm font-semibold text-content-primary mb-4">Card Status Breakdown</h3>
          <ChartEmpty message="No card data for this period." />
        </div>
      </div>
    </div>
  )
}

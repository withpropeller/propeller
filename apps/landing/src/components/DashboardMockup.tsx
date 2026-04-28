import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  CreditCard,
  Users,
  ShieldCheck,
  ArrowLeftRight,
  Wallet,
  Settings,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  BarChart3,
  FileText,
  PieChart,
  Briefcase,
  Layers,
  Share2,
  Star,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

const sidebarSections = [
  {
    label: 'Payments',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', active: true },
      { icon: CreditCard, label: 'Pay-ins', hasChevron: true },
      { icon: ArrowLeftRight, label: 'Payouts', hasChevron: true },
      { icon: Wallet, label: 'Balances' },
      { icon: BarChart3, label: 'Transactions' },
    ],
  },
  {
    label: 'Merchants',
    items: [
      { icon: Users, label: 'Businesses', hasChevron: true },
      { icon: ShieldCheck, label: 'KYB / KYC' },
      { icon: FileText, label: 'Compliance', hasChevron: true },
      { icon: Layers, label: 'Ledger' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { icon: Settings, label: 'API Keys & Webhooks' },
      { icon: Briefcase, label: 'Payout Destinations' },
      { icon: PieChart, label: 'FX Rates' },
    ],
  },
]

const metricCards = [
  {
    label: 'ARR',
    value: '$28M',
    data: [
      { v: 18 }, { v: 19 }, { v: 19.5 }, { v: 20 }, { v: 21 },
      { v: 22 }, { v: 23 }, { v: 24 }, { v: 25 }, { v: 26 },
      { v: 26.5 }, { v: 27 }, { v: 27.5 }, { v: 28 },
    ],
    color: '#3b82f6',
    fill: '#dbeafe',
  },
  {
    label: 'Cash',
    value: '$46M',
    data: [
      { v: 52 }, { v: 51 }, { v: 50 }, { v: 49 }, { v: 48 },
      { v: 47 }, { v: 46.5 }, { v: 46 }, { v: 45.5 }, { v: 46 },
      { v: 47 }, { v: 48 }, { v: 46 }, { v: 46 },
    ],
    color: '#10b981',
    fill: '#d1fae5',
  },
  {
    label: 'Average ACV',
    value: '$23K',
    data: [
      { v: 18 }, { v: 19 }, { v: 20 }, { v: 21 }, { v: 22 },
      { v: 23 }, { v: 22.5 }, { v: 23 }, { v: 23.5 }, { v: 23 },
      { v: 22.5 }, { v: 23 }, { v: 23.2 }, { v: 23 },
    ],
    color: '#8b5cf6',
    fill: '#ede9fe',
  },
  {
    label: 'Runway',
    value: '14 Months',
    data: [
      { v: 22 }, { v: 20 }, { v: 19 }, { v: 18 }, { v: 17 },
      { v: 16 }, { v: 15.5 }, { v: 15 }, { v: 14.5 }, { v: 14 },
      { v: 13.5 }, { v: 14 }, { v: 14.2 }, { v: 14 },
    ],
    color: '#f59e0b',
    fill: '#fef3c7',
  },
]

const roadmapItems = [
  {
    title: 'Series C Fundraising',
    quarters: ['Q1'],
    expanded: false,
    assignee: null,
  },
  {
    title: 'Marketing Initiatives',
    quarters: ['Q2'],
    expanded: true,
    assignee: 'https://i.pravatar.cc/150?u=1',
  },
  {
    title: 'Increase Sales Headcount',
    quarters: ['Q3'],
    expanded: true,
    assignee: 'https://i.pravatar.cc/150?u=2',
  },
]

const scenarioData = [
  { driver: 'Revenue', base: '$22M', rev3x: '$66M', variance: '200%', starred: true },
  { driver: 'Headcount', base: '190', rev3x: '210', variance: '2%', starred: false },
  { driver: 'Operating Expenses', base: '$19M', rev3x: '$21M', variance: '9%', starred: false },
]

function MiniChart({ data, color }: { data: any[]; color: string }) {
  return (
    <div className="w-full h-12">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="i" hide />
          <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#grad-${color.replace('#', '')})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.5 }}
      className="relative w-full max-w-5xl mx-auto"
    >
      {/* Browser chrome */}
      <div className="bg-white rounded-t-xl border border-warm-border overflow-hidden shadow-2xl">
        {/* Window controls */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-warm-border bg-white">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-cream-100 text-xs text-warm-light">
              <span>withpropeller.com</span>
              <ChevronDown size={12} />
            </div>
          </div>
        </div>

        {/* App layout */}
        <div className="flex" style={{ minHeight: '520px' }}>
          {/* Sidebar */}
          <div className="w-56 border-r border-warm-border bg-[#f8f8f8] p-3 hidden sm:block">
            <div className="space-y-4 mt-1">
              {sidebarSections.map((section, si) => (
                <div key={si}>
                  {section.label && (
                    <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-warm-light mb-1.5">
                      {section.label}
                    </p>
                  )}
                  <nav className="space-y-0.5">
                    {section.items.map((item) => (
                      <button
                        key={item.label}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                          item.active
                            ? 'bg-[#eaeaea] text-warm-text'
                            : 'text-warm-light hover:bg-[#efefef] hover:text-warm-text'
                        }`}
                      >
                        <item.icon size={13} strokeWidth={1.5} />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.hasChevron && (
                          <ChevronRight size={11} className="text-warm-light" />
                        )}
                      </button>
                    ))}
                  </nav>
                </div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 p-5 md:p-6 bg-white">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-1.5 text-sm text-warm-text">
                <span className="flex items-center gap-1 font-medium">
                  <BarChart3 size={13} className="text-warm-muted" />
                  Overview
                </span>
                <ChevronRight size={13} className="text-warm-light" />
                <span className="flex items-center gap-1 font-semibold">
                  <LayoutDashboard size={13} className="text-warm-text" />
                  Exec Dashboard
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-warm-border text-[11px] text-warm-muted hover:bg-cream-50 transition-colors">
                  <Share2 size={11} />
                  Share
                </button>
                <button className="text-warm-light hover:text-warm-muted">
                  <Search size={15} />
                </button>
                <button className="text-warm-light hover:text-warm-muted">
                  <Bell size={15} />
                </button>
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-300 to-orange-400" />
              </div>
            </div>

            {/* Metric row with charts */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {metricCards.map((card) => (
                <div
                  key={card.label}
                  className="p-3 rounded-lg bg-white border border-warm-border hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[10px] font-medium text-warm-light uppercase tracking-wide">
                      {card.label}
                    </span>
                  </div>
                  <p className="text-base font-bold text-warm-text mb-2">{card.value}</p>
                  <MiniChart data={card.data} color={card.color} />
                </div>
              ))}
            </div>

            {/* Growth Roadmap */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-warm-text mb-3">Growth Roadmap</h3>
              <div className="rounded-lg border border-warm-border overflow-hidden">
                <div className="grid grid-cols-[1fr_80px_80px_80px] text-[10px] text-warm-light px-3 py-2 border-b border-warm-border bg-cream-50/50">
                  <span>Plan</span>
                  <span className="text-center">Q2</span>
                  <span className="text-center">Q3</span>
                  <span className="text-center">Q4</span>
                </div>
                {roadmapItems.map((item) => (
                  <div
                    key={item.title}
                    className="grid grid-cols-[1fr_80px_80px_80px] items-center px-3 py-2 border-b border-warm-border last:border-b-0 hover:bg-cream-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronRight size={11} className="text-warm-light" />
                      <span className="text-[11px] text-warm-text">{item.title}</span>
                    </div>
                    {['Q2', 'Q3', 'Q4'].map((q) => (
                      <div key={q} className="flex justify-center">
                        {item.quarters.includes(q) && item.assignee ? (
                          <img
                            src={item.assignee}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover ring-1 ring-white"
                          />
                        ) : item.quarters.includes(q) ? (
                          <div className="w-5 h-5 rounded-full bg-runway-propellerBlue/10" />
                        ) : null}
                      </div>
                    ))}
                  </div>
                ))}
                <div className="px-3 py-2 border-t border-warm-border">
                  <button className="text-[11px] text-warm-light hover:text-warm-muted transition-colors">
                    + Create plan
                  </button>
                </div>
              </div>
            </div>

            {/* Scenario Comparison */}
            <div>
              <h3 className="text-sm font-semibold text-warm-text mb-3">Scenario Comparison</h3>
              <div className="rounded-lg border border-warm-border overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_1fr_80px_1fr] items-center px-3 py-2 border-b border-warm-border bg-cream-50/50 text-[10px] text-warm-light">
                  <span>Driver</span>
                  <span className="flex items-center gap-1 justify-center">
                    <span className="w-2 h-2 rounded-sm bg-blue-400" />
                    Base
                  </span>
                  <span className="flex items-center gap-1 justify-center">
                    <span className="w-2 h-2 rounded-sm bg-green-400" />
                    3x Revenue
                  </span>
                  <span className="text-center">Variance %</span>
                  <span className="flex items-center gap-1 justify-center">
                    <span className="w-2 h-2 rounded-sm bg-blue-400" />
                    Base
                  </span>
                </div>
                {scenarioData.map((row) => (
                  <div
                    key={row.driver}
                    className="grid grid-cols-[1fr_1fr_1fr_80px_1fr] items-center px-3 py-2.5 border-b border-warm-border last:border-b-0 hover:bg-cream-50/50 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-[11px] text-warm-text">
                      {row.starred && <Star size={10} className="text-warm-light fill-warm-light" />}
                      {row.driver}
                    </span>
                    <span className="text-center text-[11px] text-warm-muted">{row.base}</span>
                    <span className="text-center text-[11px] text-warm-muted">{row.rev3x}</span>
                    <span className="text-center text-[11px] text-warm-muted">{row.variance}</span>
                    <span className="text-center text-[11px] text-warm-muted">{row.base}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle shadow/reflection */}
      <div className="absolute -bottom-4 left-4 right-4 h-8 bg-gradient-to-b from-black/5 to-transparent rounded-b-xl blur-sm" />
    </motion.div>
  )
}

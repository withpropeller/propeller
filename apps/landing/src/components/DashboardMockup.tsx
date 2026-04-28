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
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react'
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
    label: 'Pay-in Volume',
    value: '₦128.4M',
    solid: [18, 22, 30, 35, 48, 55, 62, 68, 75, 88, 95, 108, 118, 128.4],
    dashed: [18, 28, 32, 38, 45, 52, 58, 65, 70, 82, 90, 100, 112, 120],
    color: '#10b981',
    fill: '#d1fae5',
  },
  {
    label: 'USDC Settled',
    value: '$2.4M',
    solid: [48, 46, 44, 42, 40, 38, 36, 35, 34, 33, 32, 31, 30, 28],
    dashed: [48, 47, 46, 45, 44, 43, 42, 40, 38, 36, 34, 32, 30, 28],
    color: '#3b82f6',
    fill: '#dbeafe',
  },
  {
    label: 'Active Customers',
    value: '14,203',
    solid: [22, 24, 23, 25, 24, 26, 25, 27, 26, 28, 27, 29, 28, 30],
    dashed: [22, 23, 24, 25, 26, 27, 28, 27, 28, 29, 30, 29, 30, 31],
    color: '#8b5cf6',
    fill: '#ede9fe',
  },
  {
    label: 'Success Rate',
    value: '97.3%',
    solid: [42, 40, 38, 35, 32, 30, 28, 25, 22, 20, 18, 15, 12, 10],
    dashed: [42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29],
    color: '#0ea5e9',
    fill: '#e0f2fe',
  },
]

const transactions = [
  { customer: 'Adebayo O.', amount: '₦45,000', method: 'Bank Transfer', status: 'completed', settled: '$28.40' },
  { customer: 'Sarah K.', amount: '₦12,500', method: 'Mobile Money', status: 'completed', settled: '$7.89' },
  { customer: 'James M.', amount: '₦89,000', method: 'Bank Transfer', status: 'pending', settled: '—' },
  { customer: 'Amina C.', amount: '₦34,200', method: 'Mobile Money', status: 'completed', settled: '$21.58' },
  { customer: 'Kwame B.', amount: '₦67,500', method: 'Bank Transfer', status: 'completed', settled: '$42.60' },
]

const chatMessages = [
  {
    from: 'Compliance',
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-50',
    text: 'KYC approved for Merchant #4821 — Flutterwave Corp.',
    time: '2m ago',
  },
  {
    from: 'System',
    icon: TrendingUp,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    text: 'Settlement batch #8921 processed — $124K USDC to wallet 0x7a…3f',
    time: '12m ago',
  },
  {
    from: 'Alert',
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    text: 'Volume spike detected on GT Bank rail (+340% vs. avg).',
    time: '28m ago',
  },
]

function SparklineDual({ solid, dashed, color }: { solid: number[]; dashed: number[]; color: string }) {
  const width = 180
  const height = 48
  const pad = 4

  const all = [...solid, ...dashed]
  const min = Math.min(...all)
  const max = Math.max(...all)
  const range = max - min || 1

  const xFor = (i: number) => pad + (i / (solid.length - 1)) * (width - pad * 2)
  const yFor = (v: number) => height - pad - ((v - min) / range) * (height - pad * 2)

  const path = (data: number[]) =>
    data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(v)}`).join(' ')

  const areaPath = (data: number[]) => {
    const top = path(data)
    const first = `${xFor(0)} ${height - pad}`
    const last = `${xFor(data.length - 1)} ${height - pad}`
    return `${top} L ${last} L ${first} Z`
  }

  const dividerX = width * 0.6

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {/* Fill under solid line */}
      <path d={areaPath(solid)} fill={`url(#grad-${color.replace('#', '')})`} />

      {/* Dashed line */}
      <path d={path(dashed)} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="3 3" opacity={0.6} />

      {/* Solid line */}
      <path d={path(solid)} fill="none" stroke={color} strokeWidth={1.5} />

      {/* Vertical divider */}
      <line x1={dividerX} y1={pad} x2={dividerX} y2={height - pad} stroke="#1a1a1a" strokeWidth={1} opacity={0.15} />
    </svg>
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
        <div className="flex">
          {/* Sidebar — DO NOT TOUCH */}
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
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-warm-border text-[11px] text-warm-muted hover:bg-cream-50 transition-colors">
                  <Share2 size={11} />
                  Share
                </button>
                <button className="text-warm-light hover:text-warm-muted">
                  <Search size={15} />
                </button>
                <button className="relative text-warm-light hover:text-warm-muted">
                  <Bell size={15} />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-runway-propellerBlue" />
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
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-medium text-warm-light uppercase tracking-wide">
                      {card.label}
                    </span>
                    <span className="text-[11px] font-bold text-warm-text">{card.value}</span>
                  </div>
                  <SparklineDual
                    solid={card.solid}
                    dashed={card.dashed}
                    color={card.color}
                  />
                </div>
              ))}
            </div>

            {/* Two-column: Transaction Feed + Compliance Chat */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 mb-6">
              {/* Transaction Feed */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-warm-text">Live Transaction Feed</h3>
                  <span className="text-[10px] text-warm-light">Last 24 hours</span>
                </div>
                <div className="rounded-lg border border-warm-border overflow-hidden">
                  <div className="grid grid-cols-[1fr_90px_100px_80px_70px] items-center px-3 py-2 border-b border-warm-border bg-cream-50/50 text-[10px] text-warm-light">
                    <span>Customer</span>
                    <span className="text-right">Amount</span>
                    <span className="text-center">Method</span>
                    <span className="text-center">Status</span>
                    <span className="text-right">Settled</span>
                  </div>
                  {transactions.map((tx) => (
                    <div
                      key={tx.customer}
                      className="grid grid-cols-[1fr_90px_100px_80px_70px] items-center px-3 py-2.5 border-b border-warm-border last:border-b-0 hover:bg-cream-50/50 transition-colors"
                    >
                      <span className="text-[11px] text-warm-text font-medium truncate">{tx.customer}</span>
                      <span className="text-right text-[11px] text-warm-text">{tx.amount}</span>
                      <span className="text-center text-[10px] text-warm-muted">{tx.method}</span>
                      <span className="flex justify-center">
                        {tx.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                            <CheckCircle2 size={9} />
                            Done
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                            <Clock size={9} />
                            Pending
                          </span>
                        )}
                      </span>
                      <span className="text-right text-[11px] text-warm-muted">{tx.settled}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Chat / Notifications */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-warm-text">Team Chat</h3>
                  <span className="text-[10px] text-warm-light">4 unread</span>
                </div>
                <div className="rounded-lg border border-warm-border p-3 space-y-3 bg-cream-50/30">
                  {chatMessages.map((msg) => (
                    <div key={msg.text} className="flex gap-2.5">
                      <div className={`w-6 h-6 rounded-full ${msg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <msg.icon size={12} className={msg.color} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-semibold text-warm-text">{msg.from}</span>
                          <span className="text-[9px] text-warm-light">{msg.time}</span>
                        </div>
                        <p className="text-[11px] text-warm-muted leading-snug">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  <button className="w-full text-center text-[10px] text-warm-light hover:text-warm-muted transition-colors pt-1">
                    View all messages
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient — blends the white mockup into the cream page background */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-white/0 via-white/0 to-cream-100 pointer-events-none z-10" />
      </div>

      {/* Subtle shadow/reflection
       <div className="absolute -bottom-4 left-4 right-4 h-8 bg-gradient-to-b from-black/5 to-transparent rounded-b-xl blur-sm" />
   
   */}
      </motion.div>
  )
}

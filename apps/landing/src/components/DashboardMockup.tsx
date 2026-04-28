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
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
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
    label: 'Pay-in Volume',
    value: '₦128.4M',
    data: [
      { v: 82 }, { v: 88 }, { v: 95 }, { v: 102 }, { v: 98 },
      { v: 110 }, { v: 115 }, { v: 120 }, { v: 118 }, { v: 124 },
      { v: 128 }, { v: 126 }, { v: 130 }, { v: 128.4 },
    ],
    color: '#e85d4a',
    fill: '#fde8e5',
  },
  {
    label: 'USDC Settled',
    value: '$2.4M',
    data: [
      { v: 1.2 }, { v: 1.4 }, { v: 1.5 }, { v: 1.6 }, { v: 1.7 },
      { v: 1.8 }, { v: 1.9 }, { v: 2.0 }, { v: 2.1 }, { v: 2.2 },
      { v: 2.25 }, { v: 2.3 }, { v: 2.35 }, { v: 2.4 },
    ],
    color: '#8b5cf6',
    fill: '#ede9fe',
  },
  {
    label: 'Active Customers',
    value: '14,203',
    data: [
      { v: 8200 }, { v: 8500 }, { v: 8900 }, { v: 9200 }, { v: 9600 },
      { v: 10100 }, { v: 10600 }, { v: 11100 }, { v: 11600 }, { v: 12100 },
      { v: 12800 }, { v: 13400 }, { v: 13800 }, { v: 14203 },
    ],
    color: '#10b981',
    fill: '#d1fae5',
  },
  {
    label: 'Success Rate',
    value: '97.3%',
    data: [
      { v: 94.2 }, { v: 94.8 }, { v: 95.1 }, { v: 95.5 }, { v: 95.8 },
      { v: 96.1 }, { v: 96.4 }, { v: 96.6 }, { v: 96.8 }, { v: 97.0 },
      { v: 97.1 }, { v: 97.2 }, { v: 97.25 }, { v: 97.3 },
    ],
    color: '#f59e0b',
    fill: '#fef3c7',
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
  {
    from: 'Support',
    icon: MessageCircle,
    color: 'text-runway-propellerBlue',
    bg: 'bg-blue-50',
    text: 'New merchant onboarding request from Kenya — M-Pesa integration.',
    time: '1h ago',
  },
]

const settlementPipeline = [
  { market: 'Nigeria', method: 'Bank Transfer', volume: '₦84.2M', settlement: '$52.8K USDC', status: 'Settled' },
  { market: 'Ghana', method: 'Mobile Money', volume: '₦23.1M', settlement: '$14.5K USDC', status: 'Settled' },
  { market: 'Kenya', method: 'Mobile Money', volume: '₦15.4M', settlement: '$9.7K USDC', status: 'Pending' },
  { market: 'South Africa', method: 'Bank Transfer', volume: '₦5.7M', settlement: '$3.6K USDC', status: 'Settled' },
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
        <div className="flex" style={{ minHeight: '580px' }}>
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
                <span className="flex items-center gap-1 font-semibold">
                  <LayoutDashboard size={13} className="text-warm-text" />
                  Payments Dashboard
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

            {/* Settlement Pipeline */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-warm-text">Settlement Pipeline</h3>
                <span className="text-[10px] text-warm-light">Today</span>
              </div>
              <div className="rounded-lg border border-warm-border overflow-hidden">
                <div className="grid grid-cols-[1fr_110px_100px_100px_80px] items-center px-3 py-2 border-b border-warm-border bg-cream-50/50 text-[10px] text-warm-light">
                  <span>Market</span>
                  <span className="text-center">Method</span>
                  <span className="text-right">Volume</span>
                  <span className="text-right">Settlement</span>
                  <span className="text-center">Status</span>
                </div>
                {settlementPipeline.map((row) => (
                  <div
                    key={row.market}
                    className="grid grid-cols-[1fr_110px_100px_100px_80px] items-center px-3 py-2.5 border-b border-warm-border last:border-b-0 hover:bg-cream-50/50 transition-colors"
                  >
                    <span className="text-[11px] text-warm-text font-medium">{row.market}</span>
                    <span className="text-center text-[10px] text-warm-muted">{row.method}</span>
                    <span className="text-right text-[11px] text-warm-text">{row.volume}</span>
                    <span className="text-right text-[11px] text-warm-text">{row.settlement}</span>
                    <span className="flex justify-center">
                      {row.status === 'Settled' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                          <CheckCircle2 size={9} />
                          Settled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          <Clock size={9} />
                          Pending
                        </span>
                      )}
                    </span>
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

import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  CreditCard,
  Users,
  ShieldCheck,
  ArrowLeftRight,
  Settings,
  Search,
  Bell,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react'

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Overview', active: true },
  { icon: CreditCard, label: 'Payments' },
  { icon: Users, label: 'Merchants' },
  { icon: ArrowLeftRight, label: 'FX & Settlement' },
  { icon: ShieldCheck, label: 'Compliance' },
  { icon: Wallet, label: 'Ledger' },
  { icon: Settings, label: 'Settings' },
]

const recentTxns = [
  { name: 'AfriTrade Ltd', type: 'Payout', amount: '-$12,400', status: 'completed', trend: 'down' },
  { name: 'SinoNigeria Ex', type: 'Pay-in', amount: '+₦8,500,000', status: 'pending', trend: 'up' },
  { name: 'Greenfield Agro', type: 'Payout', amount: '-$5,200', status: 'completed', trend: 'down' },
]

export default function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.5 }}
      className="relative w-full max-w-5xl mx-auto"
    >
      {/* Browser chrome */}
      <div className="bg-white rounded-t-xl border border-warm-border border-b-0 overflow-hidden shadow-2xl">
        {/* Window controls */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-warm-border bg-white">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-cream-100 text-xs text-warm-light">
              <span>propeller.com</span>
              <ChevronDown size={12} />
            </div>
          </div>
        </div>

        {/* App layout */}
        <div className="flex" style={{ minHeight: '400px' }}>
          {/* Sidebar */}
          <div className="w-52 border-r border-warm-border bg-cream-50/50 p-4 hidden sm:block">
            <div className="flex items-center gap-2 mb-6 px-2">
              <div className="w-6 h-6 rounded bg-runway-propellerBlue flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">P</span>
              </div>
              <span className="text-sm font-semibold text-warm-text">Propeller</span>
            </div>

            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    item.active
                      ? 'bg-white text-warm-text shadow-sm border border-warm-border'
                      : 'text-warm-light hover:text-warm-muted'
                  }`}
                >
                  <item.icon size={14} strokeWidth={1.5} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1 p-5 md:p-6 bg-white">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-medium text-warm-text">Overview</h2>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cream-50 border border-warm-border text-xs text-warm-light">
                  <Search size={12} />
                  <span>Search transactions...</span>
                </div>
                <Bell size={16} className="text-warm-light" />
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-runway-propellerBlue to-purple-500" />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Volume', value: '₦2.4B', change: '+12%', positive: true },
                { label: 'Active Merchants', value: '1,284', change: '+8%', positive: true },
                { label: 'Settlement Rate', value: '99.7%', change: '+0.3%', positive: true },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-4 rounded-xl bg-cream-50 border border-warm-border"
                >
                  <p className="text-[11px] text-warm-light mb-1">{stat.label}</p>
                  <div className="flex items-end justify-between">
                    <p className="text-lg font-semibold text-warm-text">{stat.value}</p>
                    <span
                      className={`flex items-center gap-0.5 text-[11px] font-medium ${
                        stat.positive ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {stat.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {stat.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent transactions */}
            <div className="rounded-xl border border-warm-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-warm-border bg-cream-50/50">
                <p className="text-xs font-medium text-warm-text">Recent Transactions</p>
                <span className="text-[11px] text-runway-propellerBlue font-medium cursor-pointer">
                  View all
                </span>
              </div>
              <div className="divide-y divide-warm-border">
                {recentTxns.map((txn) => (
                  <div key={txn.name} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          txn.trend === 'up' ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        {txn.trend === 'up' ? (
                          <TrendingUp size={12} className="text-green-600" />
                        ) : (
                          <TrendingDown size={12} className="text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-warm-text">{txn.name}</p>
                        <p className="text-[10px] text-warm-light">{txn.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-warm-text">{txn.amount}</p>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          txn.status === 'completed'
                            ? 'bg-green-50 text-green-600'
                            : 'bg-yellow-50 text-yellow-600'
                        }`}
                      >
                        {txn.status}
                      </span>
                    </div>
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

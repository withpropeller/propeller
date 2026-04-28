import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import {
  CreditCard,
  ArrowsLeftRight,
  ShieldCheck,
  PaperPlane,
  Flask,
  Coins,
  Code,
  ClipboardText,
  LockKey,
  Flag,
  Users,
  TreeStructure,
} from '@phosphor-icons/react'

const tabs = [
  {
    id: 'collect',
    label: 'Collect',
    heading: 'Collect local payments from across Africa',
    description:
      'A single API for bank transfers, mobile money, and USSD. Your customers pay how they already do — in Naira, Cedis, Shillings, and more.',
    cta: 'Explore collection',
    image: '/yu-ao-feng-YcF14W6hwQQ-unsplash.jpg',
    cards: [
      {
        title: '150+ local payment methods',
        description:
          'Accept bank transfers, mobile money, and USSD across Nigeria, Ghana, Kenya, and South Africa — all through a single API integration.',
        cta: 'Learn more',
      },
      {
        title: 'Real-time confirmation',
        description:
          'Customers get instant payment confirmation. No waiting, no uncertainty — just a fast, reliable checkout experience they can trust.',
        cta: 'Learn more',
      },
      {
        title: 'Virtual account generation',
        description:
          'Generate dedicated virtual NUBAN accounts per transaction or customer. Automated reconciliation without manual matching.',
        cta: 'Learn more',
      },
    ],
  },
  {
    id: 'convert',
    label: 'Convert',
    heading: 'Convert and settle in USDC, same day',
    description:
      'Lock in FX rates at payment initiation and receive USDC at your wallet within hours. No correspondent banks. No hidden fees.',
    cta: 'Explore settlement',
    image: '/microsoft-365-oUbzU87d1Gc-unsplash.jpg',
    cards: [
      {
        title: 'Competitive corridor rates',
        description:
          'Lock in transparent NGN-to-USDC rates at payment initiation. No hidden spreads, no last-minute surprises — just fair pricing.',
        cta: 'Learn more',
      },
      {
        title: 'Same-day USDC settlement',
        description:
          'Receive USDC at your wallet on Base or Ethereum within hours. Skip correspondent banks and multi-day delays entirely.',
        cta: 'Learn more',
      },
      {
        title: 'Automated compliance checks',
        description:
          'KYB, AML, and sanctions screening run automatically on every transaction. Stay ahead of regulations without lifting a finger.',
        cta: 'Learn more',
      },
    ],
  },
  {
    id: 'scale',
    label: 'Scale',
    heading: 'Scale operations without adding headcount',
    description:
      'Programmable payouts, webhook streaming, sandbox testing, and immutable audit trails — the infrastructure layer global teams rely on.',
    cta: 'Explore operations',
    image: '/william-william-NndKt2kF1L4-unsplash.jpg',
    cards: [
      {
        title: 'Programmable payouts',
        description:
          'Define payout rules, multi-party splits, and schedules via API. Automate disbursements to vendors, creators, or sellers.',
        cta: 'Learn more',
      },
      {
        title: 'Webhook & event streaming',
        description:
          'Get real-time events for every state change. Build reactive systems with reliable, signed webhooks and comprehensive logs.',
        cta: 'Learn more',
      },
      {
        title: 'Sandbox + audit trails',
        description:
          'Test every flow in a full sandbox environment. Every action is logged immutably for reconciliation, dispute resolution, and audit.',
        cta: 'Learn more',
      },
    ],
  },
]

const capabilities = [
  { label: 'Virtual accounts', Icon: CreditCard, color: '#a78bfa' },
  { label: 'Real-time FX', Icon: ArrowsLeftRight, color: '#facc15' },
  { label: 'Compliance engine', Icon: ShieldCheck, color: '#4ade80' },
  { label: 'Webhook delivery', Icon: PaperPlane, color: '#fb923c' },
  { label: 'Sandbox testing', Icon: Flask, color: '#38bdf8' },
  { label: 'Multi-currency', Icon: Coins, color: '#f472b6' },
  { label: 'API & SDKs', Icon: Code, color: '#60a5fa' },
  { label: 'Audit trails', Icon: ClipboardText, color: '#f87171' },
  { label: 'Escrow logic', Icon: LockKey, color: '#a78bfa' },
  { label: 'Milestones', Icon: Flag, color: '#fde047' },
  { label: 'Bulk payouts', Icon: Users, color: '#c084fc' },
  { label: 'Dashboard', Icon: TreeStructure, color: '#7dd3fc' },
]

export default function SolutionsSection() {
  const [activeTab, setActiveTab] = useState('collect')
  const active = tabs.find((t) => t.id === activeTab)!

  return (
    <div className="px-4 md:px-6 lg:px-8 py-6">
      <section
        id="solutions"
        className="bg-[#111111] py-20 md:py-28 rounded-[28px]"
      >
        <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal text-white leading-tight text-center">
              The payment infrastructure global companies use to{' '}
              <span className="bg-gradient-to-r from-[#e85d4a] to-[#8b5cf6] bg-clip-text text-transparent">
                serve Africa
              </span>
            </h2>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center justify-center gap-2 mb-12"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 md:px-7 py-2.5 text-sm font-medium rounded-full transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-[#111111] shadow-sm'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* Content per tab */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
            >
              {/* 3-up feature cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-6">
                {active.cards.map((card, i) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                    className="group bg-[#1a1a1a] rounded-[20px] p-6 border border-white/5 hover:border-white/15 transition-all duration-300 cursor-default"
                  >
                    <h3 className="text-[15px] font-semibold text-white mb-2 leading-snug group-hover:text-white/90 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-[13px] text-white/45 leading-relaxed mb-5 group-hover:text-white/60 transition-colors">
                      {card.description}
                    </p>
                    <a
                      href="#"
                      className="inline-flex items-center gap-1 text-xs font-medium text-white/60 group-hover:text-white transition-colors"
                    >
                      {card.cta}
                      <ArrowUpRight
                        size={12}
                        strokeWidth={2}
                        className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200"
                      />
                    </a>
                  </motion.div>
                ))}
              </div>

              {/* Large image per tab */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="rounded-[24px] overflow-hidden mb-6 bg-[#1a1a1a]"
              >
                <img
                  src={active.image}
                  alt={active.heading}
                  className="w-full h-[300px] md:h-[420px] object-cover"
                />
              </motion.div>

              {/* Bottom bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-[#1a1a1a] rounded-[20px] p-6 md:p-8 border border-white/5"
              >
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-8 items-start">
                  {/* Left */}
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">
                      {active.heading}
                    </p>
                    <p className="text-[13px] text-white/40 mb-4 leading-relaxed max-w-sm">
                      {active.description}
                    </p>
                    <a
                      href="#"
                      className="inline-flex items-center gap-1 text-xs font-medium text-white/70 hover:text-white transition-colors"
                    >
                      {active.cta}
                      <ArrowUpRight size={12} strokeWidth={2} />
                    </a>
                  </div>

                  {/* Right capability tags */}
                  <div className="flex flex-wrap justify-end gap-2">
                    {capabilities.map((cap) => (
                      <span
                        key={cap.label}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] text-[12px] text-white/60 border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
                      >
                        <cap.Icon
                          size={13}
                          weight="regular"
                          color={cap.color}
                        />
                        {cap.label}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  )
}

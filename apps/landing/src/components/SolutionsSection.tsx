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
    id: 'b2b',
    label: 'B2B',
    heading: 'B2B Payment Platforms',
    description:
      'Create the future of cross-border trade with unique features that help you offer first rate experiences in your B2B platform. Leverage our virtual account functionality and real-time FX conversion to simplify earnings management for your merchants.',
    cta: 'Learn more about B2B solutions',
    image: '/william-william-NndKt2kF1L4-unsplash.jpg',
    cards: [
      {
        title: 'Virtual account functionality',
        desc: 'Generate dedicated virtual accounts for each merchant or transaction, enabling automated reconciliation and streamlined cash-flow management.',
        cta: 'Learn more',
      },
      {
        title: 'Real-time FX conversion',
        desc: 'Lock in competitive NGN-to-USDC rates at payment initiation with transparent pricing and instant execution across the corridor.',
        cta: 'Learn more',
      },
      {
        title: 'Compliance-first settlement',
        desc: 'Built-in KYB, AML screening, and sanctions checks run automatically so your platform stays ahead of regulatory requirements.',
        cta: 'Learn more',
      },
    ],
  },
  {
    id: 'b2c',
    label: 'B2C',
    heading: 'B2C Checkout Solutions',
    description:
      'Enable seamless checkout experiences for consumers across Africa and Asia. Accept local payments via NIP transfers and deliver instant settlement to merchants in USDC.',
    cta: 'Learn more about B2C solutions',
    image: '/rosebox-BFdSCxmqvYc-unsplash.jpg',
    cards: [
      {
        title: 'Local payment methods',
        desc: 'Accept bank transfers, mobile money, and USSD from customers across Nigeria, Ghana, Kenya and South Africa — all through one integration.',
        cta: 'Learn more',
      },
      {
        title: 'Instant confirmation',
        desc: 'Customers receive real-time payment confirmation via bank transfer, reducing cart abandonment and improving trust at checkout.',
        cta: 'Learn more',
      },
      {
        title: 'USDC settlement',
        desc: 'Merchants receive settlement in USDC at the wallet of their choice, eliminating correspondent banking delays and FX opacity.',
        cta: 'Learn more',
      },
    ],
  },
  {
    id: 'platform',
    label: 'Platform',
    heading: 'Marketplace Platforms',
    description:
      'Power your marketplace with programmable payouts, multi-party splitting, and automated compliance screening. Let every seller focus on their business while you handle the money movement.',
    cta: 'Learn more about platform solutions',
    image: '/microsoft-365-oUbzU87d1Gc-unsplash.jpg',
    cards: [
      {
        title: 'Programmable payouts',
        desc: 'Define payout rules, splits, and schedules via API. Automate disbursements to vendors, creators, or service providers on your platform.',
        cta: 'Learn more',
      },
      {
        title: 'Multi-party splitting',
        desc: 'Split incoming payments between multiple recipients automatically — perfect for marketplaces with sellers, agents, and platform fees.',
        cta: 'Learn more',
      },
      {
        title: 'Automated compliance',
        desc: 'Every transaction is screened in real-time against sanctions lists and AML rules, keeping your marketplace compliant by default.',
        cta: 'Learn more',
      },
    ],
  },
  {
    id: 'fx',
    label: 'FX',
    heading: 'FX & Remittance',
    description:
      'Offer competitive NGN-to-USDC conversion rates with transparent pricing. Lock in rates at payment initiation and deliver fast, compliant settlement to destination wallets.',
    cta: 'Learn more about FX solutions',
    image: '/william-william-NndKt2kF1L4-unsplash.jpg',
    cards: [
      {
        title: 'Competitive corridor rates',
        desc: 'Access institutional-grade NGN-to-USDC pricing with full transparency — no hidden spreads or last-minute markups.',
        cta: 'Learn more',
      },
      {
        title: 'Rate lock at initiation',
        desc: 'Lock in the exchange rate when the payment request is created, protecting both you and your customers from volatility.',
        cta: 'Learn more',
      },
      {
        title: 'Fast compliant settlement',
        desc: 'Settle to any USDC wallet on Base or Ethereum within hours, with full audit trails and regulatory documentation included.',
        cta: 'Learn more',
      },
    ],
  },
  {
    id: 'crowdfunding',
    label: 'Crowdfunding',
    heading: 'Crowdfunding Platforms',
    description:
      'Collect contributions in NGN from backers across Nigeria and settle to project creators in USDC. Built-in KYC, escrow-like holding, and automated disbursement on milestone completion.',
    cta: 'Learn more about crowdfunding solutions',
    image: '/rosebox-BFdSCxmqvYc-unsplash.jpg',
    cards: [
      {
        title: 'NGN contribution collection',
        desc: 'Backers pay via familiar local methods — bank transfer, mobile money, or USSD — with instant confirmation and receipt.',
        cta: 'Learn more',
      },
      {
        title: 'Milestone-based disbursement',
        desc: 'Hold funds in escrow-like accounts and release them to project creators only when predefined milestones are verified.',
        cta: 'Learn more',
      },
      {
        title: 'Built-in KYC & screening',
        desc: 'Every backer and creator is automatically verified through Dojah KYC and sanctions screening, keeping your platform safe.',
        cta: 'Learn more',
      },
    ],
  },
]

const capabilities = [
  { label: 'Virtual accounts', Icon: CreditCard },
  { label: 'Real-time FX', Icon: ArrowsLeftRight },
  { label: 'Compliance engine', Icon: ShieldCheck },
  { label: 'Webhook delivery', Icon: PaperPlane },
  { label: 'Sandbox testing', Icon: Flask },
  { label: 'Multi-currency', Icon: Coins },
  { label: 'API & SDKs', Icon: Code },
  { label: 'Audit trails', Icon: ClipboardText },
  { label: 'Escrow logic', Icon: LockKey },
  { label: 'Milestones', Icon: Flag },
  { label: 'Bulk payouts', Icon: Users },
  { label: 'Dashboard', Icon: TreeStructure },
]

export default function SolutionsSection() {
  const [activeTab, setActiveTab] = useState('b2b')
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
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal text-white leading-tight">
              The payment infrastructure global companies use to{' '}
              <span className="bg-gradient-to-r from-[#e85d4a] to-[#8b5cf6] bg-clip-text text-transparent">
                serve Africa
              </span>
              .
            </h2>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center justify-center gap-1 md:gap-2 mb-12"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 md:px-6 py-2 text-sm font-medium rounded-full transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-[#111111] shadow-sm'
                    : 'text-white/60 hover:text-white/90'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
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
                    className="bg-[#1a1a1a] rounded-[20px] p-6 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <h3 className="text-[15px] font-medium text-white mb-2 leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-[13px] text-white/50 leading-relaxed mb-4">
                      {card.desc}
                    </p>
                    <a
                      href="#"
                      className="inline-flex items-center gap-1 text-xs font-medium text-white/70 hover:text-white transition-colors"
                    >
                      {card.cta}
                      <ArrowUpRight size={12} strokeWidth={2} />
                    </a>
                  </motion.div>
                ))}
              </div>

              {/* Large image */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="rounded-[24px] overflow-hidden mb-6"
              >
                <img
                  src={active.image}
                  alt={active.heading}
                  className="w-full h-[300px] md:h-[420px] object-cover"
                />
              </motion.div>

              {/* Bottom capabilities bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-[#1a1a1a] rounded-[20px] p-6 md:p-8 border border-white/5"
              >
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-8 items-start">
                  {/* Left copy */}
                  <div>
                    <p className="text-[13px] text-white/40 mb-3">
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
                  <div className="flex flex-wrap gap-2">
                    {capabilities.map((cap) => (
                      <span
                        key={cap.label}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-[12px] text-white/60 border border-white/5"
                      >
                        <cap.Icon size={12} weight="regular" />
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

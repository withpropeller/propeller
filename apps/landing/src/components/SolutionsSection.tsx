import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const tabs = [
  {
    id: 'b2b',
    label: 'B2B',
    heading: 'B2B Payment Platforms',
    description:
      'Create the future of cross-border trade with unique features that help you offer first rate experiences in your B2B platform. Leverage our virtual account functionality and real-time FX conversion to simplify earnings management for your merchants.',
    cta: 'Learn more about B2B solutions',
  },
  {
    id: 'b2c',
    label: 'B2C',
    heading: 'B2C Checkout Solutions',
    description:
      'Enable seamless checkout experiences for consumers across Africa and Asia. Accept local payments via NIP transfers and deliver instant settlement to merchants in USDC.',
    cta: 'Learn more about B2C solutions',
  },
  {
    id: 'platform',
    label: 'Platform',
    heading: 'Marketplace Platforms',
    description:
      'Power your marketplace with programmable payouts, multi-party splitting, and automated compliance screening. Let every seller focus on their business while you handle the money movement.',
    cta: 'Learn more about platform solutions',
  },
  {
    id: 'fx',
    label: 'FX',
    heading: 'FX & Remittance',
    description:
      'Offer competitive NGN-to-USDC conversion rates with transparent pricing. Lock in rates at payment initiation and deliver fast, compliant settlement to destination wallets.',
    cta: 'Learn more about FX solutions',
  },
  {
    id: 'crowdfunding',
    label: 'Crowdfunding',
    heading: 'Crowdfunding Platforms',
    description:
      'Collect contributions in NGN from backers across Nigeria and settle to project creators in USDC. Built-in KYC, escrow-like holding, and automated disbursement on milestone completion.',
    cta: 'Learn more about crowdfunding solutions',
  },
]

export default function SolutionsSection() {
  const [activeTab, setActiveTab] = useState('b2b')
  const active = tabs.find((t) => t.id === activeTab)!

  return (
    <section className="bg-cream-100 py-20 md:py-28">
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-normal text-warm-text">
            Ready to go solutions
          </h2>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-center gap-1 md:gap-2 mb-10"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 md:px-6 py-2 text-sm font-medium rounded-full transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-warm-text shadow-sm border border-warm-border'
                  : 'text-warm-light hover:text-warm-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Content Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-[24px] p-8 md:p-12 shadow-sm border border-warm-border"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              {/* Left: Copy */}
              <div>
                <p className="text-xs font-medium uppercase tracking-label text-warm-light mb-4">
                  Solutions
                </p>
                <h3 className="text-2xl md:text-3xl font-normal text-warm-text mb-4">
                  {active.heading}
                </h3>
                <p className="text-base text-warm-muted leading-body mb-6">
                  {active.description}
                </p>
                <a
                  href="#"
                  className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-warm-text border border-warm-border hover:border-warm-muted rounded-sharp transition-colors"
                >
                  {active.cta}
                </a>
              </div>

              {/* Right: Image placeholder */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-cream-200">
                <div className="absolute inset-0 bg-gradient-to-br from-cream-200 to-cream-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-cream-100 flex items-center justify-center">
                      <span className="text-3xl">📦</span>
                    </div>
                    <p className="text-sm text-warm-light">Solution preview</p>
                  </div>
                </div>
                {/* Decorative dots */}
                <div
                  className="absolute top-4 right-4 w-20 h-20 opacity-20"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #9e9690 1px, transparent 1px)',
                    backgroundSize: '8px 8px',
                  }}
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

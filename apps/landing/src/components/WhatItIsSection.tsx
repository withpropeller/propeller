import { motion } from 'framer-motion'
import { Landmark, ArrowLeftRight, ShieldCheck } from 'lucide-react'
import DottedFrame from './DottedFrame'

const features = [
  {
    icon: Landmark,
    title: 'Local rails',
    description:
      'Accept bank transfers, mobile money, and local payment methods across Africa — through one integration.',
  },
  {
    icon: ArrowLeftRight,
    title: 'USDC settlement',
    description:
      'Receive settlement in USDC at the wallet or account of your choice. No correspondent banks.',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance handled',
    description:
      'KYC, AML, and local regulatory requirements are managed by our regulated partner network.',
  },
]

export default function WhatItIsSection() {
  return (
    <section
      id="what-it-is"
      className="relative bg-cream-50 py-20 md:py-28 border-t border-warm-border"
    >
      <DottedFrame className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20 py-12 md:py-16">
        {/* ─── Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14 md:mb-20"
        >
          <h2 className="text-3xl md:text-4xl lg:text-[44px] font-normal leading-tight text-warm-text max-w-3xl">
            The payment infrastructure global companies use to{' '}
            <span className="bg-gradient-to-r from-[#e85d4a] to-[#8b5cf6] bg-clip-text text-transparent">
              serve Africa
            </span>
          </h2>
          <p className="text-sm text-warm-muted leading-body max-w-sm">
            Accept Naira from Nigerian customers. Settle in USDC. Propeller
            handles the local rails, compliance, and reconciliation — so you
            don't have to build any of it.
          </p>
        </motion.div>

        {/* ─── Bento grid ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-4 md:mb-5">
          {/* Card 1 — Local payment experience */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative overflow-hidden rounded-[24px] border border-warm-border bg-cream-100 flex flex-col md:flex-row"
          >
            {/* Text side */}
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-between order-2 md:order-1">
              <div className="space-y-4">
                <div className="bg-white rounded-[14px] p-4 border border-warm-border shadow-sm">
                  <p className="text-[13px] text-warm-muted leading-relaxed mb-3">
                    Your customer in Lagos receives a checkout link. They pay via
                    bank transfer in Naira. Confirmation is instant.
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-warm-text bg-cream-100 px-2 py-1 rounded-md border border-warm-border">
                      ₦ 150,000
                    </span>
                    <span className="text-xs text-warm-light">NGN → USDC</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium text-warm-text mb-1.5">
                  Local payment experience
                </h3>
                <p className="text-sm text-warm-muted leading-body">
                  Bank transfer, mobile money, and USSD — your customers pay
                  however they already do. One API covers every market.
                </p>
              </div>
            </div>

            {/* Image side */}
            <div className="relative w-full md:w-[45%] h-56 md:h-auto order-1 md:order-2 overflow-hidden">
              <img
                src="./bento-payment.jpg"
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Card 2 — Cross-border settlement */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative overflow-hidden rounded-[24px] border border-warm-border bg-cream-100 flex flex-col md:flex-row"
          >
            {/* Text side */}
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-between order-2 md:order-1">
              <div className="space-y-4">
                <div className="bg-white rounded-[14px] p-4 border border-warm-border shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-warm-text">
                      Settlement
                    </span>
                    <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                      Completed
                    </span>
                  </div>
                  <p className="text-[13px] text-warm-muted leading-relaxed">
                    Funds received in NGN have been converted and sent to your
                    USDC wallet on Base.
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium text-warm-text mb-1.5">
                  Cross-border settlement
                </h3>
                <p className="text-sm text-warm-muted leading-body">
                  No correspondent banks. No multi-day delays. Receive USDC at
                  the wallet or account of your choice, same day.
                </p>
              </div>
            </div>

            {/* Image side */}
            <div className="relative w-full md:w-[45%] h-56 md:h-auto order-1 md:order-2 overflow-hidden">
              <img
                src="./bento-shipping.jpg"
                alt="Cargo ship with containers"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </div>

        {/* ─── Bottom 3-up feature cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              className="group bg-white rounded-[20px] p-6 border border-warm-border hover:border-warm-light/50 transition-colors"
            >
              <div className="mb-5">
                <div className="w-10 h-10 rounded-xl bg-cream-100 flex items-center justify-center group-hover:bg-cream-200 transition-colors">
                  <feature.icon
                    size={18}
                    className="text-warm-muted group-hover:text-warm-text transition-colors"
                    strokeWidth={1.5}
                  />
                </div>
              </div>
              <h4 className="text-[15px] font-medium text-warm-text mb-1.5">
                {feature.title}
              </h4>
              <p className="text-[13px] text-warm-muted leading-body">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </DottedFrame>
    </section>
  )
}

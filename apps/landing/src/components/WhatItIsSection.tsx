import { motion } from 'framer-motion'
import { Landmark, ArrowLeftRight, ShieldCheck } from 'lucide-react'

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
    <section id="what-it-is" className="bg-cream-100 py-20 md:py-28 border-t border-warm-border">
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-14 md:mb-20"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal leading-tight text-warm-text mb-4">
            The payment infrastructure global companies use to{' '}
            <span className="bg-gradient-to-r from-[#e85d4a] to-[#8b5cf6] bg-clip-text text-transparent">
              serve Africa
            </span>
          </h2>
          <p className="text-base md:text-lg text-warm-muted leading-body">
            Accept Naira from Nigerian customers. Settle in USDC. Propeller
            handles the local rails, compliance, and reconciliation — so you
            don't have to build any of it.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="group bg-white rounded-[20px] p-6 md:p-8 border border-warm-border hover:border-warm-light/50 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-cream-100 flex items-center justify-center mb-5 group-hover:bg-cream-200 transition-colors">
                <feature.icon
                  size={20}
                  className="text-warm-muted group-hover:text-warm-text transition-colors"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="text-lg font-medium text-warm-text mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-warm-muted leading-body">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

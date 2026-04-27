import { motion } from 'framer-motion'
import { Banknote, ShieldCheck, Coins } from 'lucide-react'

const steps = [
  {
    number: '01',
    title: 'End-payer sends NGN',
    description:
      'The billed party initiates payment via a standard NIP bank transfer to a dedicated virtual account. No app download required.',
    icon: Banknote,
  },
  {
    number: '02',
    title: 'Reef handles compliance & FX',
    description:
      'Every transaction is screened for sanctions, KYC is verified via Dojah, and FX conversion is executed at competitive rates.',
    icon: ShieldCheck,
  },
  {
    number: '03',
    title: 'Merchant receives USDC',
    description:
      'Once cleared, USDC is settled to the merchant\'s designated wallet. Fast, traceable, and fully compliant.',
    icon: Coins,
  },
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-runway-black">
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14 md:mb-20"
        >
          <p className="text-xs font-medium uppercase tracking-label text-runway-coolSlate mb-4">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal leading-tight tracking-tight text-white max-w-2xl">
            From Naira to USDC in three steps
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="group relative bg-runway-surface border border-runway-borderDark rounded-comfortable p-6 md:p-8 hover:border-runway-coolSlate/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs font-medium uppercase tracking-label text-runway-propellerBlue">
                  Step {step.number}
                </span>
                <step.icon
                  size={20}
                  className="text-runway-coolSlate group-hover:text-white transition-colors"
                />
              </div>
              <h3 className="text-lg md:text-xl font-normal text-white mb-3 leading-tight">
                {step.title}
              </h3>
              <p className="text-sm leading-body text-runway-coolSlate">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

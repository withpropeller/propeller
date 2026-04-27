import { motion } from 'framer-motion'
import {
  Landmark,
  UserCheck,
  ArrowLeftRight,
  Wallet,
  Search,
  Webhook,
} from 'lucide-react'

const features = [
  {
    title: 'Virtual Accounts',
    description:
      'Dedicated NGN virtual accounts via Paystack PWT. Each invoice gets a unique account number for clean reconciliation.',
    icon: Landmark,
  },
  {
    title: 'KYC / KYB',
    description:
      'Automated identity verification with Dojah liveness checks and PayKKa business onboarding. Human-in-the-loop only for tier upgrades.',
    icon: UserCheck,
  },
  {
    title: 'FX Conversion',
    description:
      'Competitive NGN-to-USDC rates with transparent pricing. Lock in rates at payment initiation.',
    icon: ArrowLeftRight,
  },
  {
    title: 'USDC Settlement',
    description:
      'Fast off-ramp to merchant wallets via Globalstack. On-chain traceability with traditional banking compliance.',
    icon: Wallet,
  },
  {
    title: 'Compliance Screening',
    description:
      'Real-time sanctions and PEP screening via ComplyAdvantage. Address screening and travel-rule ready.',
    icon: Search,
  },
  {
    title: 'Webhook API',
    description:
      'Signed, retry-aware webhooks for every state change. RESTful API with OpenAPI docs for super-merchant integrations.',
    icon: Webhook,
  },
]

export default function FeaturesGrid() {
  return (
    <section id="features" className="bg-runway-deep">
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14 md:mb-20"
        >
          <p className="text-xs font-medium uppercase tracking-label text-runway-coolSlate mb-4">
            Features
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal leading-tight tracking-tight text-white max-w-2xl">
            Everything you need to move money across borders
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group p-6 md:p-8 rounded-comfortable border border-runway-borderDark hover:border-runway-coolSlate/30 transition-colors"
            >
              <feature.icon
                size={22}
                className="text-runway-propellerBlue mb-5"
                strokeWidth={1.5}
              />
              <h3 className="text-base md:text-lg font-normal text-white mb-2 leading-tight">
                {feature.title}
              </h3>
              <p className="text-sm leading-body text-runway-coolSlate">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

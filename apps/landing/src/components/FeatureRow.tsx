import { motion } from 'framer-motion'
import { Globe, CreditCard, TrendingUp } from 'lucide-react'

const features = [
  {
    icon: Globe,
    label: 'Global coverage',
    description:
      'Win every market by offering local and international means of payment and adapt checkout to your local strategy.',
  },
  {
    icon: CreditCard,
    label: 'Pay-in capabilities',
    description:
      'Accept NGN via virtual accounts, bank transfers, and mobile money with instant confirmation and reconciliation.',
  },
  {
    icon: TrendingUp,
    label: 'Conversion-focused',
    description:
      'Boost your conversion rate with adaptive payment flows, fraud and compliance rules that reduce checkout friction.',
  },
]

export default function FeatureRow() {
  return (
    <section className="bg-cream-50 py-12 md:py-16">
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {features.map((feature, i) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <feature.icon
                size={18}
                className="text-warm-light mb-3"
                strokeWidth={1.5}
              />
              <p className="text-xs font-medium uppercase tracking-label text-warm-light mb-2">
                {feature.label}
              </p>
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

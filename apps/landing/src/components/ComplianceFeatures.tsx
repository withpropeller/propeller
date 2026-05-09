import { motion } from 'framer-motion'
import { Shield, Building2, Fingerprint } from 'lucide-react'

const features = [
  {
    icon: Shield,
    heading: 'KYC – Know Your Customer',
    description:
      'Drive up your customer base through automated user onboarding via our API. Dojah-powered identity verification with liveness checks.',
  },
  {
    icon: Building2,
    heading: 'KYB – Know Your Business',
    description:
      'We verify users against reliable and independent global data sources ranging from government registries to public records data.',
  },
  {
    icon: Fingerprint,
    heading: 'Unique verification tailored to your needs',
    description:
      'Create workflows that speed up your user verification and onboarding journeys with tiered KYC levels and risk-based screening.',
  },
]

export default function ComplianceFeatures() {
  return (
    <section className="bg-cream-50 py-12 md:py-16 border-t border-warm-border">
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {features.map((feature, i) => (
            <motion.div
              key={feature.heading}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="pt-6 border-t border-warm-border"
            >
              <feature.icon
                size={20}
                className="text-warm-light mb-4"
                strokeWidth={1.5}
              />
              <h3 className="text-base font-medium text-warm-text mb-2 leading-tight">
                {feature.heading}
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

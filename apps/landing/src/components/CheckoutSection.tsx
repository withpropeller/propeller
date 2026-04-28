import { motion } from 'framer-motion'
import { X, Check } from 'lucide-react'

const without = [
  'Local entity required in each market',
  'Local banking relationships needed',
  'Compliance managed in-house',
  'High cart abandonment at checkout',
  'Settlement delayed weeks',
]

const withPropeller = [
  'One API integration',
  'Regulated partners handle local rails',
  'Compliance automated',
  'Local checkout experience',
  'USDC settlement in days',
]

export default function CheckoutSection() {
  return (
    <section className="bg-cream-50 py-20 md:py-28">
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-14 md:mb-20"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal leading-tight text-warm-text mb-4">
            Your African customers deserve a{' '}
            <span className="bg-gradient-to-r from-[#e85d4a] to-[#8b5cf6] bg-clip-text text-transparent">
              seamless checkout
            </span>
          </h2>
          <p className="text-base md:text-lg text-warm-muted leading-body">
            Most global payment stacks fail at the last mile in Africa — wrong
            currencies, unsupported banks, failed transactions. Propeller gives
            you a single integration to accept local payments across Africa
            without setting up locally.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {/* Without Propeller */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-[20px] p-6 md:p-8 border border-warm-border"
          >
            <p className="text-xs font-medium uppercase tracking-label text-warm-light mb-6">
              Without Propeller
            </p>
            <ul className="space-y-4">
              {without.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <X
                    size={16}
                    className="text-red-400 mt-0.5 shrink-0"
                    strokeWidth={2.5}
                  />
                  <span className="text-sm text-warm-muted">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* With Propeller */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="bg-white rounded-[20px] p-6 md:p-8 border border-runway-propellerBlue/20 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-label text-runway-propellerBlue mb-6">
              With Propeller
            </p>
            <ul className="space-y-4">
              {withPropeller.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-runway-propellerBlue/10 flex items-center justify-center mt-0.5 shrink-0">
                    <Check
                      size={10}
                      className="text-runway-propellerBlue"
                      strokeWidth={3}
                    />
                  </div>
                  <span className="text-sm text-warm-text font-medium">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

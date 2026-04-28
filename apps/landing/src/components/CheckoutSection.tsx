import { motion } from 'framer-motion'
import { X, Check } from 'lucide-react'

const comparisonRows = [
  {
    feature: 'Real-time local payment confirmation',
    withPropeller: true,
    withoutPropeller: false,
  },
  {
    feature: 'Single API for multiple African markets',
    withPropeller: true,
    withoutPropeller: false,
  },
  {
    feature: 'Built-in compliance and partner rails',
    withPropeller: true,
    withoutPropeller: false,
  },
  {
    feature: 'Side-by-side transaction and settlement visibility',
    withPropeller: true,
    withoutPropeller: false,
  },
  {
    feature: 'Collaborative workflow for finance + ops teams',
    withPropeller: true,
    withoutPropeller: true,
  },
  {
    feature: 'Version control and audit trail support',
    withPropeller: true,
    withoutPropeller: true,
  },
  {
    feature: 'AI-powered operational insights',
    withPropeller: true,
    withoutPropeller: true,
  },
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

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="max-w-5xl mx-auto border border-warm-border rounded-[22px] bg-white overflow-hidden"
        >
          <div className="grid grid-cols-[1.2fr_0.4fr_0.4fr] md:grid-cols-[2fr_1fr_1fr] items-center border-b border-warm-border px-4 md:px-8 py-4 md:py-5">
            <p className="text-xs uppercase tracking-label text-warm-light font-medium">
              Comparison
            </p>
            <div className="flex justify-center">
              <p className="inline-flex items-center gap-2 text-sm md:text-base font-medium text-warm-text">
                <span className="inline-flex items-center justify-center">
                  <img src="/propeller-icon.svg" alt="Propeller" className="w-5 h-5" />
                </span>
                Propeller
              </p>
            </div>
            <p className="text-sm md:text-base font-medium text-warm-muted text-center">
              Others
            </p>
          </div>

          {comparisonRows.map((row) => (
            <div
              key={row.feature}
              className="grid grid-cols-[1.2fr_0.4fr_0.4fr] md:grid-cols-[2fr_1fr_1fr] items-center px-4 md:px-8 py-4 md:py-5 border-b border-warm-border last:border-b-0"
            >
              <p className="text-sm md:text-base text-warm-text pr-3">{row.feature}</p>

              <div className="flex justify-center">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                    row.withPropeller
                      ? 'bg-[#161108] text-white'
                      : 'bg-warm-border text-warm-muted'
                  }`}
                >
                  {row.withPropeller ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    <X size={14} strokeWidth={2.6} />
                  )}
                </span>
              </div>

              <div className="flex justify-center">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                    row.withoutPropeller
                      ? 'bg-[#161108] text-white'
                      : 'bg-warm-border text-warm-muted'
                  }`}
                >
                  {row.withoutPropeller ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    <X size={14} strokeWidth={2.6} />
                  )}
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

import { motion } from 'framer-motion'
import { Code, Banknote, Wallet } from 'lucide-react'

const steps = [
  {
    number: '01',
    title: 'Integrate the API',
    description:
      'Add Propeller to your checkout in an afternoon. REST endpoints, SDKs for Node and Python, full sandbox environment included.',
    icon: Code,
  },
  {
    number: '02',
    title: 'Your customers pay locally',
    description:
      'Customers in Nigeria, Ghana, Kenya, and South Africa pay in local currency via bank transfer or mobile money. Familiar. Fast. No friction.',
    icon: Banknote,
  },
  {
    number: '03',
    title: 'You receive USDC',
    description:
      'Propeller\'s regulated partners handle the settlement. You receive USDC at your wallet or account of choice. Reconciliation data included.',
    icon: Wallet,
  },
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-cream-50 py-20 md:py-28 border-t border-warm-border">
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14 md:mb-20"
        >
          <p className="text-xs font-medium uppercase tracking-label text-warm-light mb-3">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal leading-tight text-warm-text">
            Three steps. One integration.
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
              className="group relative bg-white border border-warm-border rounded-[20px] p-6 md:p-8 hover:border-warm-light/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs font-medium uppercase tracking-label text-runway-propellerBlue">
                  Step {step.number}
                </span>
                <step.icon
                  size={20}
                  className="text-warm-light group-hover:text-warm-text transition-colors"
                />
              </div>
              <h3 className="text-lg md:text-xl font-normal text-warm-text mb-3 leading-tight">
                {step.title}
              </h3>
              <p className="text-sm leading-body text-warm-muted">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

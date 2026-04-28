import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    title: 'Integrate',
    subtitle: 'Integrate all your sources',
    description:
      'Connect Propeller to your checkout in an afternoon. REST endpoints, SDKs for Node and Python, and a full sandbox environment included.',
    duration: '1-day setup',
  },
  {
    number: '02',
    title: 'Collect',
    subtitle: 'Your customers pay locally',
    description:
      'Customers in Nigeria, Ghana, Kenya, and South Africa pay in local currency via bank transfer or mobile money. Familiar. Fast. No friction.',
    duration: 'Instant confirmation',
  },
  {
    number: '03',
    title: 'Settle',
    subtitle: 'You receive USDC',
    description:
      'Propeller\'s regulated partners handle the settlement. You receive USDC at your wallet or account of choice. Reconciliation data included.',
    duration: 'Same-day settlement',
  },
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-cream-50 py-20 md:py-28 border-t border-warm-border">
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-10 md:mb-14"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal leading-tight text-warm-text">
            Fast track to clarity
          </h2>
          <p className="text-sm md:text-base text-warm-muted leading-body max-w-sm">
            Start building a unified payment model you can trust as the source
            of truth for cross-border settlement.
          </p>
        </motion.div>

        {/* Timeline Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="bg-white rounded-[24px] p-6 md:p-10 lg:p-12 border border-warm-border shadow-sm"
        >
          {/* Card header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 md:mb-10">
            <h3 className="text-lg md:text-xl font-normal text-warm-text">
              Onboarding guided by compliance experts
            </h3>
            <a
              href="#"
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#e85d4a] to-[#8b5cf6] hover:opacity-90 rounded-sharp transition-opacity"
            >
              Talk to a Human
            </a>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Horizontal line — desktop only */}
            <div className="hidden md:block absolute top-[11px] left-0 right-0 h-px bg-warm-border" />

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
              {steps.map((step, i) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.12 }}
                  className="relative"
                >
                  {/* Dot */}
                  <div className="hidden md:flex absolute -top-[1px] left-0 w-6 h-6 -ml-3 items-center justify-center z-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-warm-text border-2 border-white" />
                  </div>

                  {/* Number badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-cream-100 text-[11px] font-semibold text-warm-text border border-warm-border">
                      {step.number}
                    </span>
                    <span className="text-sm font-medium text-warm-text">
                      {step.title}
                    </span>
                  </div>

                  <h4 className="text-sm font-medium text-warm-text mb-1.5">
                    {step.subtitle}
                  </h4>
                  <p className="text-sm text-warm-muted leading-body mb-3">
                    {step.description}
                  </p>
                  <p className="text-xs text-warm-light">{step.duration}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

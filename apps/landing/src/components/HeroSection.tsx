import { motion } from 'framer-motion'
import FlowDiagram from './FlowDiagram'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-cream-100 overflow-hidden pt-20 md:pt-24">
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[calc(100vh-6rem)] py-12 md:py-16">
          {/* Left: Copy */}
          <div className="max-w-xl">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[4rem] font-normal leading-tight text-warm-text mb-6"
            >
              The payment
              <br />
              layer for{' '}
              <span className="bg-gradient-to-r from-[#e85d4a] via-[#c75b9b] to-[#8b5cf6] bg-clip-text text-transparent">
                China–Africa trade
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-base md:text-lg text-warm-muted leading-body mb-8"
            >
              Build, run and operate the payment system you need to succeed.
              Accept NGN payments, send USDC payouts, and onboard merchants
              with total compliance and security.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <a
                href="#"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#e85d4a] to-[#8b5cf6] hover:opacity-90 rounded-sharp transition-opacity"
              >
                Start Building
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-warm-text border border-warm-border hover:border-warm-muted rounded-sharp transition-colors"
              >
                Contact Sales
              </a>
            </motion.div>
          </div>

          {/* Right: Diagram */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <FlowDiagram />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

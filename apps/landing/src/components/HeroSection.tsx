import { motion } from 'framer-motion'
import DashboardMockup from './DashboardMockup'

export default function HeroSection() {
  return (
    <section
      className="relative overflow-hidden pt-28 md:pt-32 pb-0"
      style={{
        backgroundImage: `
          linear-gradient(to bottom, rgba(245,242,238,0.3) 0%, rgba(245,242,238,0.85) 60%, #f5f2ee 100%),
          url('/hero-bg.jpg')
        `,
        backgroundPosition: 'center top, center 30%',
        backgroundSize: 'cover, cover',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20">
        {/* Top: Centered copy */}
        <div className="text-center max-w-3xl mx-auto pt-8 md:pt-12 pb-10 md:pb-14">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xs font-medium uppercase tracking-label text-warm-light mb-4"
          >
            FP&A for Cross-Border Teams
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal leading-tight text-warm-text mb-5"
          >
            Settle Naira.
            <br />
            Receive{' '}
            <span className="bg-gradient-to-r from-[#e85d4a] via-[#c75b9b] to-[#8b5cf6] bg-clip-text text-transparent">
              USDC
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-base md:text-lg text-warm-muted leading-body mb-8 max-w-xl mx-auto"
          >
            Collaborative planning, reporting, and settlement powered by an
            agent that knows your payment flow as well as you do.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <a
              href="#"
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#e85d4a] to-[#8b5cf6] hover:opacity-90 rounded-sharp transition-opacity"
            >
              Talk to a Human
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-warm-text border border-warm-border hover:border-warm-muted rounded-sharp transition-colors bg-white/60 backdrop-blur-sm"
            >
              <span className="w-4 h-4 rounded-full border border-warm-muted flex items-center justify-center">
                <span className="w-0 h-0 border-l-[6px] border-l-warm-text border-y-[4px] border-y-transparent ml-0.5" />
              </span>
              See it in action
            </a>
          </motion.div>
        </div>

        {/* Bottom: Dashboard mockup — blends into page below */}
        <div className="relative z-10">
          <DashboardMockup />
        </div>
      </div>
    </section>
  )
}

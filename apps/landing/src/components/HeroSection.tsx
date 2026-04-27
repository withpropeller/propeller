import { motion } from 'framer-motion'
import { ArrowRight, BookOpen } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-runway-black overflow-hidden">
      {/* Subtle gradient texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(62,89,243,0.08)_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(62,89,243,0.05)_0%,_transparent_50%)]" />

      <div className="relative z-10 max-w-cinema mx-auto px-6 md:px-12 lg:px-20 pt-20 pb-16">
        <div className="max-w-4xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xs font-medium uppercase tracking-label text-runway-coolSlate mb-6"
          >
            China–Africa Payment Corridor
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal leading-display tracking-tighter text-white mb-6"
          >
            Settle Naira.
            <br />
            Receive USDC.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="text-base md:text-lg text-runway-coolSlate leading-body max-w-2xl mb-10"
          >
            Propeller is the regulated payment layer for China–Africa trade.
            End-payers settle invoices in NGN via bank transfer.
            Merchants receive USDC at the destination of their choosing.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-runway-propellerBlue hover:bg-runway-propellerBlue/90 rounded-sharp transition-colors"
            >
              Get Started
              <ArrowRight size={16} />
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-runway-coolSlate hover:text-white border border-runway-borderDark hover:border-runway-coolSlate rounded-sharp transition-all"
            >
              <BookOpen size={16} />
              Read the Docs
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

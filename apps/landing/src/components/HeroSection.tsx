import { motion } from 'framer-motion'
import DashboardMockup from './DashboardMockup'
import GridBackground from './GridBackground'

export default function HeroSection() {
  return (
    <section className="relative bg-cream-100 overflow-hidden pt-20 md:pt-24">
      {/* Hero grid — fine dots, fade at bottom */}
      <GridBackground dotColor="#c9c5c0" gap={24} radius={1} fade="bottom" />

      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(./hero-bg.jpg)' }}
      />
      <div className="absolute inset-0 bg-cream-100/70" />
      <div className="relative z-10 max-w-cinema mx-auto px-6 md:px-12 lg:px-20">
        <div className="relative z-10 text-center max-w-3xl mx-auto pt-12 md:pt-20 pb-10 md:pb-14">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xs font-medium uppercase tracking-label text-warm-light mb-4"
          >
            The world's best products deserve African customers
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal leading-tight text-warm-text mb-5"
          >
            Sell to Africa.
            <br />
            <span className="bg-gradient-to-r from-[#e85d4a] via-[#c75b9b] to-[#8b5cf6] bg-clip-text text-transparent">
              Get paid
            </span>{' '}
            without
            <br />
            the headache.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-base md:text-lg text-warm-muted leading-body mb-4 max-w-xl mx-auto"
          >
            Propeller helps global businesses accept payments from African
            customers — in local currency, through local rails, with full
            compliance built in.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="text-sm text-warm-light mb-8"
          >
            No local entity required. No banking headaches. No FX guesswork.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
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

        <div className="pb-8 md:pb-12">
          <DashboardMockup />
        </div>
      </div>
    </section>
  )
}

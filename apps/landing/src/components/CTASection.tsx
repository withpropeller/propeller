import { motion } from 'framer-motion'

export default function CTASection() {
  return (
    <section className="relative overflow-hidden min-h-[60vh] flex items-center justify-center">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(./cta-africa.jpg)' }}
      />
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/80" />
      {/* Subtle gradient at bottom for smooth transition to footer */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/40 to-transparent" />

      <div className="relative max-w-cinema mx-auto px-6 md:px-12 lg:px-20 py-24 md:py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal leading-tight text-white mb-6">
            Africa is ready.
            <br />
            <span className="bg-gradient-to-r from-[#e85d4a] to-[#8b5cf6] bg-clip-text text-transparent">
              Are you?
            </span>
          </h2>

          <p className="text-base text-white/70 leading-body mb-8 max-w-lg mx-auto">
            Get API keys, explore the docs, or talk to the team. No slide
            decks. No long sales cycles. Just answers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#"
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#e85d4a] to-[#8b5cf6] hover:opacity-90 rounded-sharp transition-opacity"
            >
              Get API Keys
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white border border-white/30 hover:border-white/60 rounded-sharp transition-colors bg-white/10 backdrop-blur-sm"
            >
              Talk to Sales
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

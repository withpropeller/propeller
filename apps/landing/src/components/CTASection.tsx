import { motion } from 'framer-motion'

export default function CTASection() {
  return (
    <section className="relative overflow-hidden">
      {/* Pastel gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#fdf2f0] via-[#f5f0f7] to-[#f0f4f8]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-pink-200/40 to-purple-200/40 rounded-full blur-3xl" />

      <div className="relative max-w-cinema mx-auto px-6 md:px-12 lg:px-20 py-24 md:py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal leading-tight text-warm-text mb-6">
            Africa is ready.
            <br />
            <span className="bg-gradient-to-r from-[#e85d4a] to-[#8b5cf6] bg-clip-text text-transparent">
              Are you?
            </span>
          </h2>

          <p className="text-base text-warm-muted leading-body mb-8 max-w-lg mx-auto">
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
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-warm-text border border-warm-border hover:border-warm-muted rounded-sharp transition-colors bg-white/60 backdrop-blur-sm"
            >
              Talk to Sales
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

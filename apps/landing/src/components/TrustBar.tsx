import { motion } from 'framer-motion'

const partners = [
  'Paystack',
  'Dojah',
  'Globalstack',
  'TigerBeetle',
  'ComplyAdvantage',
  'PayKKa',
]

export default function TrustBar() {
  return (
    <section className="bg-runway-black border-t border-runway-borderDark">
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20 py-12 md:py-16">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-xs font-medium uppercase tracking-label text-runway-midSlate text-center mb-8"
        >
          Trusted by leading infrastructure providers
        </motion.p>

        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-16">
          {partners.map((name, i) => (
            <motion.span
              key={name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="text-sm md:text-base font-medium text-runway-midSlate/60 hover:text-runway-midSlate transition-colors cursor-default"
            >
              {name}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  )
}

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
    <section className="bg-cream-100 border-t border-warm-border">
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20 py-10 md:py-14">
        <div className="flex flex-wrap items-center justify-center gap-x-10 md:gap-x-16 gap-y-5">
          {partners.map((name, i) => (
            <motion.span
              key={name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 0.5, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="text-sm md:text-base font-medium text-warm-text hover:opacity-100 transition-opacity cursor-default"
            >
              {name}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  )
}

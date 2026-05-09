import { motion } from 'framer-motion'

const partners = [
  { name: 'Paystack', logo: '/logos/paystack.svg' },
  { name: 'Quidax', logo: '/logos/quidax.svg' },
  { name: 'Dojah', logo: '/logos/dojah.svg' },
  { name: 'Paper', logo: '/logos/paper.svg' },
  { name: 'Topship', logo: '/logos/topship.svg' },
]

export default function TrustBar() {
  return (
    <section className="bg-cream-50">
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20 py-6 md:py-8">
        <p className="text-center text-[11px] font-medium uppercase tracking-label text-warm-light mb-4 md:mb-5">
          Trusted by leading companies
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 lg:gap-10">
          {partners.map((partner, i) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex items-center justify-center"
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className="h-5 md:h-6 w-auto opacity-40 grayscale hover:opacity-70 hover:grayscale-0 transition-all duration-300"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

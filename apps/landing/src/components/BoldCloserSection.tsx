import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const bullets = [
  'Single API — works across Nigeria, Ghana, Kenya, South Africa',
  'Regulated partner network — we hold the local relationships so you don\'t have to',
  'USDC settlement — receive at the destination of your choosing',
  'Full compliance layer — KYC, AML, and local reporting handled',
  'No local entity required — go live without incorporation',
]

export default function BoldCloserSection() {
  return (
    <section className="bg-cream-100 py-20 md:py-28 border-t border-warm-border">
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal leading-tight text-warm-text mb-4">
              Go live in Africa.{" "}
              <span className="bg-gradient-to-r from-[#e85d4a] to-[#8b5cf6] bg-clip-text text-transparent">
                Stay compliant
              </span>
            </h2>
            <p className="text-base md:text-lg text-warm-muted leading-body">
              One integration. Local payment rails. Regulated settlement.
              Propeller is how global companies accept payments from African
              customers — without setting up locally, navigating regulators, or
              wiring together a patchwork of local banking partners.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            {bullets.map((bullet, i) => (
              <motion.div
                key={bullet}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                className="flex items-start gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-runway-propellerBlue/10 flex items-center justify-center mt-0.5 shrink-0">
                  <Check size={11} className="text-runway-propellerBlue" strokeWidth={3} />
                </div>
                <p className="text-sm text-warm-text leading-relaxed">{bullet}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

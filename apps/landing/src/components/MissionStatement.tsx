import { motion } from 'framer-motion'

export default function MissionStatement() {
  return (
    <section id="mission" className="bg-runway-black">
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20 py-24 md:py-36">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl"
        >
          <p className="text-xs font-medium uppercase tracking-label text-runway-coolSlate mb-6">
            Our mission
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal leading-tight tracking-tight text-white">
            We are building the payment layer for China–Africa trade.
          </h2>
          <p className="mt-6 md:mt-8 text-base md:text-lg text-runway-coolSlate leading-body max-w-2xl">
            Trade between China and Africa crossed $280 billion in 2023. Yet
            the payment infrastructure has not kept pace. Propeller exists to
            close that gap — with regulated, compliant, and transparent
            settlement rails.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

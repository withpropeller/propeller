import { motion } from 'framer-motion'

export default function PayInToPayoutSection() {
  return (
    <section className="bg-cream-100 py-20 md:py-28">
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20">
        <div className="max-w-3xl mx-auto text-center mb-16 md:mb-24">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-base md:text-lg text-warm-muted leading-body mb-4"
          >
            From Pay-in to Payout and everything in between.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-sm text-warm-light leading-body max-w-xl mx-auto"
          >
            A little bit of everything, everywhere, all at once. From NGN collection
            to USDC settlement, Propeller handles the full payment lifecycle
            so you can focus on growing your business.
          </motion.p>
        </div>

        {/* Vertical Flow Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <svg viewBox="0 0 400 500" className="w-full h-auto" fill="none">
            {/* Background decorative circles */}
            <circle cx="200" cy="80" r="50" stroke="#e2ddd6" strokeWidth="1" fill="none" opacity="0.5" />
            <circle cx="200" cy="250" r="60" stroke="#e2ddd6" strokeWidth="1" fill="none" opacity="0.5" />
            <circle cx="200" cy="420" r="55" stroke="#e2ddd6" strokeWidth="1" fill="none" opacity="0.5" />

            {/* Vertical flow line */}
            <motion.path
              d="M200 80 L200 250 L200 420"
              stroke="#1a1a1a"
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.5 }}
            />

            {/* Horizontal branches */}
            <motion.path
              d="M200 80 L280 80"
              stroke="#1a1a1a"
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.8 }}
            />
            <motion.path
              d="M200 250 L280 250"
              stroke="#1a1a1a"
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 1.2 }}
            />
            <motion.path
              d="M200 420 L280 420"
              stroke="#1a1a1a"
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 1.6 }}
            />

            {/* Node dots */}
            <circle cx="200" cy="80" r="4" fill="#1a1a1a" />
            <circle cx="200" cy="250" r="4" fill="#1a1a1a" />
            <circle cx="200" cy="420" r="4" fill="#1a1a1a" />

            {/* Labels on the right */}
            <rect x="290" y="64" width="80" height="28" rx="4" fill="white" stroke="#e2ddd6" strokeWidth="1" />
            <text x="330" y="82" textAnchor="middle" fill="#1a1a1a" fontSize="11" fontWeight="600">Pay in</text>
            <text x="330" y="54" textAnchor="middle" fill="#6b6560" fontSize="10">₦620</text>

            <rect x="290" y="234" width="80" height="28" rx="4" fill="white" stroke="#e2ddd6" strokeWidth="1" />
            <text x="330" y="252" textAnchor="middle" fill="#1a1a1a" fontSize="11" fontWeight="600">Splitting</text>

            <rect x="290" y="404" width="80" height="28" rx="4" fill="white" stroke="#e2ddd6" strokeWidth="1" />
            <text x="330" y="422" textAnchor="middle" fill="#1a1a1a" fontSize="11" fontWeight="600">Pay out</text>
            <text x="330" y="394" textAnchor="middle" fill="#6b6560" fontSize="10">$400</text>

            {/* Left side decorative labels */}
            <text x="120" y="84" textAnchor="end" fill="#9e9690" fontSize="10" fontWeight="500">Collection</text>
            <text x="120" y="254" textAnchor="end" fill="#9e9690" fontSize="10" fontWeight="500">Compliance</text>
            <text x="120" y="424" textAnchor="end" fill="#9e9690" fontSize="10" fontWeight="500">Settlement</text>

            {/* Small icons */}
            <circle cx="200" cy="80" r="20" fill="white" stroke="#e2ddd6" strokeWidth="1" />
            <text x="200" y="85" textAnchor="middle" fill="#1a1a1a" fontSize="14">↓</text>

            <circle cx="200" cy="250" r="20" fill="white" stroke="#e2ddd6" strokeWidth="1" />
            <text x="200" y="255" textAnchor="middle" fill="#1a1a1a" fontSize="14">◈</text>

            <circle cx="200" cy="420" r="20" fill="white" stroke="#e2ddd6" strokeWidth="1" />
            <text x="200" y="425" textAnchor="middle" fill="#1a1a1a" fontSize="14">↑</text>
          </svg>
        </motion.div>
      </div>
    </section>
  )
}

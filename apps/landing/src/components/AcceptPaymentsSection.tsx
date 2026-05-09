import { motion } from 'framer-motion'

function PaymentMockup() {
  return (
    <div className="bg-white rounded-xl border border-warm-border p-5 shadow-sm">
      {/* Payment method icons */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-5 bg-black rounded-sm flex items-center justify-center">
          <span className="text-white text-[8px] font-bold">Pay</span>
        </div>
        <div className="w-8 h-5 bg-white border border-gray-200 rounded-sm flex items-center justify-center">
          <span className="text-[8px] font-bold text-blue-600">G</span>
        </div>
        <span className="text-xs text-warm-light ml-1">Card</span>
      </div>

      {/* Recent payments list */}
      <p className="text-xs font-medium text-warm-muted uppercase tracking-wide mb-3">Recent payments</p>
      <div className="space-y-3">
        {[
          { name: 'Isabelle', amount: '₦14,000.80', status: 'guaranteed' },
          { name: 'Marie', amount: '₦8,500.00', status: 'pending' },
          { name: 'Jacob', amount: '₦22,300.00', status: 'guaranteed' },
        ].map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-cream-200 flex items-center justify-center">
                <span className="text-xs font-medium text-warm-text">{item.name[0]}</span>
              </div>
              <span className="text-sm text-warm-text">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                {item.status}
              </span>
              <span className="text-sm font-medium text-warm-text">{item.amount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AcceptPaymentsSection() {
  return (
    <section className="bg-cream-50 py-8 md:py-12">
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-[24px] p-8 md:p-12 lg:p-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: Payment mockup */}
            <div className="order-2 lg:order-1">
              <PaymentMockup />
            </div>

            {/* Right: Copy */}
            <div className="order-1 lg:order-2">
              <p className="text-xs font-medium uppercase tracking-label text-warm-light mb-4">
                Payments
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-normal leading-tight text-warm-text mb-4">
                Accept payments with{' '}
                <span className="bg-gradient-to-r from-[#e85d4a] to-[#8b5cf6] bg-clip-text text-transparent">
                  more control
                </span>
              </h2>
              <p className="text-base text-warm-muted leading-body mb-6">
                Build a fast, frictionless and fail-proof payment experience
                and boost conversion rates by offering a wider range of payment
                methods. Virtual accounts, bank transfers, and mobile money.
              </p>
              <a
                href="#"
                className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-warm-text border border-warm-border hover:border-warm-muted rounded-sharp transition-colors"
              >
                Explore Payments
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

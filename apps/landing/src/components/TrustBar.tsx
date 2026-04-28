import { motion } from 'framer-motion'
import { Landmark, UserCheck, ArrowLeftRight, Database, Search, Building2 } from 'lucide-react'

const partners = [
  { name: 'Paystack', role: 'Virtual Accounts', icon: Landmark },
  { name: 'Dojah', role: 'KYC & Identity', icon: UserCheck },
  { name: 'Globalstack', role: 'USDC Settlement', icon: ArrowLeftRight },
  { name: 'TigerBeetle', role: 'Ledger Engine', icon: Database },
  { name: 'ComplyAdvantage', role: 'Compliance Screening', icon: Search },
  { name: 'PayKKa', role: 'KYB Verification', icon: Building2 },
]

export default function TrustBar() {
  return (
    <section className="bg-cream-100 border-t border-warm-border">
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20 py-16 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-14"
        >
          <p className="text-xs font-medium uppercase tracking-label text-warm-light mb-3">
            Trusted Infrastructure
          </p>
          <h3 className="text-xl md:text-2xl font-normal text-warm-text">
            Powered by leading providers across the stack
          </h3>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {partners.map((partner, i) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group flex flex-col items-center text-center p-5 rounded-xl bg-white border border-warm-border hover:border-warm-light/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-cream-100 flex items-center justify-center mb-3 group-hover:bg-cream-200 transition-colors">
                <partner.icon
                  size={18}
                  className="text-warm-muted group-hover:text-warm-text transition-colors"
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-sm font-medium text-warm-text mb-0.5">
                {partner.name}
              </p>
              <p className="text-[11px] text-warm-light leading-tight">
                {partner.role}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

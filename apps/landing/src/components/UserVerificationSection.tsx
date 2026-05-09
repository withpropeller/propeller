import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

function VerificationMockup() {
  return (
    <div className="relative">
      {/* Dotted grid background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle, #ddd5cb 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Verification cards */}
      <div className="relative space-y-3">
        {[
          { name: 'Marie Antoinette', status: 'verified', color: 'bg-purple-100' },
          { name: 'Jacob Jones', status: 'verified', color: 'bg-cream-200' },
          { name: 'Josephine Russell', status: 'pending', color: 'bg-cream-200', action: true },
        ].map((user) => (
          <div
            key={user.name}
            className="flex items-center justify-between bg-white rounded-lg border border-warm-border px-4 py-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full ${user.color} flex items-center justify-center`}>
                <span className="text-xs font-medium text-warm-text">{user.name[0]}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-warm-text">{user.name}</p>
                <p className="text-xs text-warm-light">Individual</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user.status === 'verified' && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check size={12} strokeWidth={3} />
                  <span className="text-xs font-medium">Verified</span>
                </div>
              )}
              {user.action && (
                <button className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-[#8b5cf6] to-[#c75b9b] rounded-full">
                  Explore Photo
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function UserVerificationSection() {
  return (
    <section className="bg-cream-100 py-20 md:py-28">
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-medium uppercase tracking-label text-warm-light mb-4">
              User Verification
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-normal leading-tight text-warm-text mb-4">
              Fast and{' '}
              <span className="bg-gradient-to-r from-[#e85d4a] to-[#8b5cf6] bg-clip-text text-transparent">
                frictionless
              </span>{' '}
              user verification
            </h2>
            <p className="text-base text-warm-muted leading-body mb-6">
              Verify individual and business users fast with our modern,
              compliant and automated verifications that accelerate your
              business without compromising on security.
            </p>
            <a
              href="#"
              className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-warm-text border border-warm-border hover:border-warm-muted rounded-sharp transition-colors"
            >
              Explore User Verification
            </a>
          </motion.div>

          {/* Right: Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <VerificationMockup />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

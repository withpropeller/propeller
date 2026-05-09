import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const testimonials = [
  {
    quote:
      'Propeller transformed how we settle payments with our Chinese suppliers. What used to take days now happens in minutes. The compliance layer gives our finance team peace of mind.',
    author: 'Opeyemi',
    role: 'Head of Operations @Topship',
    company: 'Topship',
  },
  {
    quote:
      'Through our partnership with Propeller we have been able to build effective solutions that enhance cross-border trade and deliver remarkable benefits for our merchants, who can receive payments safely and with confidence.',
    author: 'Victoria',
    role: 'Design Director @ArtInTheCity',
    company: 'ArtInTheCity',
  },
  {
    quote:
      'The NGN-to-USDC settlement rail is exactly what our marketplace needed. Our sellers get paid faster, and we have full visibility into every transaction through their webhook API.',
    author: 'Mayowa',
    role: 'Founder @Paper',
    company: 'Paper',
  },
]

export default function TestimonialsSection() {
  const [index, setIndex] = useState(0)
  const t = testimonials[index]

  const prev = () => setIndex((i) => (i === 0 ? testimonials.length - 1 : i - 1))
  const next = () => setIndex((i) => (i === testimonials.length - 1 ? 0 : i + 1))

  return (
    <section id="testimonials" className="bg-cream-100 py-20 md:py-28">
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-start">
          {/* Left: Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <p className="text-xs font-medium uppercase tracking-label text-warm-light mb-4">
              Testimonials
            </p>
            <h2 className="text-3xl md:text-4xl font-normal leading-tight text-warm-text mb-3">
              Built for teams that{' '}
              <span className="bg-gradient-to-r from-[#e85d4a] to-[#8b5cf6] bg-clip-text text-transparent">
                ship globally
              </span>
            </h2>

            {/* Carousel controls */}
            <div className="flex items-center gap-3 mt-8">
              <div className="flex gap-1.5">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === index ? 'bg-warm-text w-4' : 'bg-warm-border'
                    }`}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={prev}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-warm-border hover:border-warm-muted text-warm-muted hover:text-warm-text transition-colors"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={next}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-warm-border hover:border-warm-muted text-warm-muted hover:text-warm-text transition-colors"
                  aria-label="Next testimonial"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Right: Quote card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="bg-white rounded-[24px] p-8 md:p-10 shadow-sm border border-warm-border">
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-base md:text-lg text-warm-text leading-body mb-8">
                    {t.quote}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-warm-text">
                        {t.author}
                      </p>
                      <p className="text-xs text-warm-light">{t.role}</p>
                    </div>
                    <span className="text-lg font-semibold text-warm-text tracking-tight">
                      {t.company}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

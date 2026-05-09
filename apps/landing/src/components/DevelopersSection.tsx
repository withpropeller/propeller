import { motion } from 'framer-motion'
import { FileText, Play } from 'lucide-react'

function CodeMockup() {
  const code = `{
  "AuthorId": "123456",
  "DebitedFunds": {
    "Currency": "NGN",
    "Amount": 120000
  },
  "Fees": {
    "Currency": "NGN",
    "Amount": 1000
  },
  "CreditedWalletId": "12345678",
  "ReturnURL": "https://withpropeller.com/successful-payment",
}`

  const lines = code.split('\n')

  return (
    <div className="bg-[#1e0f24] rounded-xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
        <div className="ml-4 flex gap-1">
          {['REST', 'Node.js', 'Python'].map((lang) => (
            <span
              key={lang}
              className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                lang === 'REST'
                  ? 'bg-white/20 text-white'
                  : 'text-white/40'
              }`}
            >
              {lang}
            </span>
          ))}
        </div>
      </div>

      {/* Code */}
      <div className="p-4 overflow-x-auto">
        <pre className="text-xs leading-relaxed">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="w-6 text-right text-white/20 select-none mr-3">
                {i + 1}
              </span>
              <code>
                {line.split(/("[^"]+")/g).map((part, j) =>
                  part.startsWith('"') && part.endsWith('"') ? (
                    <span key={j} className="text-orange-300">
                      {part}
                    </span>
                  ) : part.match(/^\d+$/) ? (
                    <span key={j} className="text-purple-300">
                      {part}
                    </span>
                  ) : (
                    <span key={j} className="text-white/70">
                      {part}
                    </span>
                  )
                )}
              </code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  )
}

export default function DevelopersSection() {
  return (
    <section id="developers" className="bg-[#150a18] py-20 md:py-28">
      <div className="max-w-cinema mx-auto px-6 md:px-12 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Code mockup */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <CodeMockup />
          </motion.div>

          {/* Right: Copy */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-normal leading-tight text-white mb-4">
              Created with developers,
              <br />
              for developers
            </h2>
            <p className="text-base text-white/60 leading-body mb-8 max-w-md">
              Reduce time to market with our developer friendly SDKs that
              include features and functionalities that make integration easy.
              RESTful API with OpenAPI docs, signed webhooks, and deterministic
              idempotency keys.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                <FileText size={20} className="text-white/40 mb-3" />
                <h3 className="text-sm font-medium text-white mb-1">
                  Documentation
                </h3>
                <p className="text-xs text-white/50 leading-relaxed mb-3">
                  Product API, technical architecture and code samples.
                </p>
                <a
                  href="#"
                  className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Read doc →
                </a>
              </div>

              <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                <Play size={20} className="text-white/40 mb-3" />
                <h3 className="text-sm font-medium text-white mb-1">
                  API demo
                </h3>
                <p className="text-xs text-white/50 leading-relaxed mb-3">
                  The best way to understand our API.
                </p>
                <a
                  href="#"
                  className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Test the demo →
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

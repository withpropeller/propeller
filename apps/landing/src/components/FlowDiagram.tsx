import { motion } from 'framer-motion'

export default function FlowDiagram() {
  return (
    <div className="relative w-full h-[400px] md:h-[480px]">
      {/* SVG diagram */}
      <svg viewBox="0 0 480 400" className="w-full h-full" fill="none">
        {/* Background circles */}
        <circle cx="150" cy="80" r="50" stroke="#e2ddd6" strokeWidth="1" fill="none" />
        <circle cx="350" cy="160" r="60" stroke="#e2ddd6" strokeWidth="1" fill="none" />
        <circle cx="200" cy="280" r="55" stroke="#e2ddd6" strokeWidth="1" fill="none" />

        {/* Main flow lines */}
        <motion.path
          d="M150 80 L350 80 L350 160"
          stroke="#1a1a1a"
          strokeWidth="1.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />
        <motion.path
          d="M350 160 L350 260 L200 260 L200 280"
          stroke="#1a1a1a"
          strokeWidth="1.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 1 }}
        />
        <motion.path
          d="M350 160 L450 160"
          stroke="#1a1a1a"
          strokeWidth="1.5"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
        />

        {/* Node dots */}
        <circle cx="150" cy="80" r="4" fill="#1a1a1a" />
        <circle cx="350" cy="80" r="4" fill="#1a1a1a" />
        <circle cx="350" cy="160" r="4" fill="#1a1a1a" />
        <circle cx="350" cy="260" r="4" fill="#1a1a1a" />
        <circle cx="200" cy="260" r="4" fill="#1a1a1a" />
        <circle cx="450" cy="160" r="4" fill="#1a1a1a" />

        {/* Labels */}
        <rect x="110" y="20" width="80" height="24" rx="4" fill="#f5f2ee" stroke="#e2ddd6" strokeWidth="1" />
        <text x="150" y="36" textAnchor="middle" fill="#1a1a1a" fontSize="11" fontWeight="500">KYC</text>

        <rect x="310" y="52" width="80" height="24" rx="4" fill="#f5f2ee" stroke="#e2ddd6" strokeWidth="1" />
        <text x="350" y="68" textAnchor="middle" fill="#1a1a1a" fontSize="11" fontWeight="500">Pay-in</text>
        <text x="350" y="42" textAnchor="middle" fill="#6b6560" fontSize="10">NGN</text>

        <rect x="310" y="132" width="80" height="24" rx="4" fill="#f5f2ee" stroke="#e2ddd6" strokeWidth="1" />
        <text x="350" y="148" textAnchor="middle" fill="#1a1a1a" fontSize="11" fontWeight="500">Splitting</text>

        <rect x="110" y="272" width="80" height="24" rx="4" fill="#f5f2ee" stroke="#e2ddd6" strokeWidth="1" />
        <text x="150" y="288" textAnchor="middle" fill="#1a1a1a" fontSize="11" fontWeight="500">Payout</text>
        <text x="150" y="314" textAnchor="middle" fill="#6b6560" fontSize="10">USDC</text>

        {/* Avatar placeholders */}
        <g transform="translate(135, 65)">
          <circle cx="0" cy="0" r="12" fill="#ddd5cb" />
          <circle cx="20" cy="0" r="12" fill="#c9ccd1" />
          <circle cx="10" cy="18" r="12" fill="#e2ddd6" />
        </g>

        {/* Currency icons */}
        <text x="380" y="74" fill="#6b6560" fontSize="12" fontWeight="600">₦</text>
        <text x="175" y="294" fill="#6b6560" fontSize="12" fontWeight="600">$</text>
      </svg>
    </div>
  )
}

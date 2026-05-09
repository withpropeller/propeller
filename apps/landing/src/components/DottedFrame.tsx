import { ReactNode } from 'react'

interface DottedFrameProps {
  children: ReactNode
  className?: string
  /** Number of vertical grid columns */
  columns?: number
  /** Vertical spacing between dots in px */
  dotInterval?: number
}

export default function DottedFrame({
  children,
  className = '',
  columns = 6,
  dotInterval = 48,
}: DottedFrameProps) {
  const patternId = `gridline-${Math.random().toString(36).slice(2, 9)}`

  return (
    <div className={`relative ${className}`}>
      {/* Thin outer border */}
      <div className="absolute inset-0 border border-warm-border rounded-[20px]" />

      {/* Measurement grid — full-height vertical lines with dot ticks */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id={patternId}
            width={`${100 / columns}%`}
            height={dotInterval}
            patternUnits="userSpaceOnUse"
          >
            {/* Vertical line */}
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={dotInterval}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-warm-border"
            />
            {/* Dot at top of each interval */}
            <circle
              cx="0"
              cy="0"
              r="1.5"
              fill="currentColor"
              className="text-warm-light"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        {/* Right edge closing line + dot */}
        <line
          x1="100%"
          y1="0"
          x2="100%"
          y2="100%"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-warm-border"
        />
        {/* Dots along the right edge at each interval */}
        {Array.from({ length: Math.ceil(1000 / dotInterval) }).map((_, i) => (
          <circle
            key={i}
            cx="100%"
            cy={i * dotInterval}
            r="1.5"
            fill="currentColor"
            className="text-warm-light"
          />
        ))}
      </svg>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

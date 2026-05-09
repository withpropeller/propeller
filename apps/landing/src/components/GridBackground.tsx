interface GridBackgroundProps {
  /** Dot color — Tailwind class or raw color value */
  dotColor?: string
  /** Gap between dots in px */
  gap?: number
  /** Dot radius in px */
  radius?: number
  /** Optional fade at top/bottom */
  fade?: 'top' | 'bottom' | 'both' | 'none'
  /** Extra CSS classes */
  className?: string
}

export default function GridBackground({
  dotColor = '#c9c5c0',
  gap = 24,
  radius = 1,
  fade = 'none',
  className = '',
}: GridBackgroundProps) {
  const patternId = `grid-${Math.random().toString(36).slice(2, 9)}`

  const fadeDefs = {
    top: (
      <linearGradient id={`${patternId}-fade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity="1" />
        <stop offset="35%" stopColor="white" stopOpacity="0" />
      </linearGradient>
    ),
    bottom: (
      <linearGradient id={`${patternId}-fade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="65%" stopColor="white" stopOpacity="0" />
        <stop offset="100%" stopColor="white" stopOpacity="1" />
      </linearGradient>
    ),
    both: (
      <linearGradient id={`${patternId}-fade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity="1" />
        <stop offset="25%" stopColor="white" stopOpacity="0" />
        <stop offset="75%" stopColor="white" stopOpacity="0" />
        <stop offset="100%" stopColor="white" stopOpacity="1" />
      </linearGradient>
    ),
    none: null,
  }

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <pattern
            id={patternId}
            width={gap}
            height={gap}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={gap / 2} cy={gap / 2} r={radius} fill={dotColor} />
          </pattern>
          {fadeDefs[fade]}
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        {fade !== 'none' && (
          <rect width="100%" height="100%" fill={`url(#${patternId}-fade)`} />
        )}
      </svg>
    </div>
  )
}

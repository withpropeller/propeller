'use client'

export function BottomIllustration() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[420px] hidden md:block overflow-hidden"
    >
      <svg
        viewBox="0 0 1600 500"
        preserveAspectRatio="xMidYMax meet"
        className="absolute inset-0 w-full h-full text-content-quaternary"
      >
        {/* Concentric orbit arcs */}
        <ellipse cx="800" cy="560" rx="260" ry="130" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.18" />
        <ellipse cx="800" cy="560" rx="460" ry="230" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.14" />
        <ellipse cx="800" cy="560" rx="680" ry="340" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.10" />
        <ellipse cx="800" cy="560" rx="920" ry="460" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.07" />

        {/* Sonar tick marks along the innermost arc */}
        {Array.from({ length: 44 }).map((_, i) => {
          const angle = 10 + (i * 160) / 43
          const rad = (angle * Math.PI) / 180
          const x1 = 800 + Math.cos(rad) * 260
          const y1 = 560 - Math.sin(rad) * 130
          const x2 = 800 + Math.cos(rad) * 272
          const y2 = 560 - Math.sin(rad) * 136
          return (
            <line
              key={`tick-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.22"
            />
          )
        })}

        {/* Scattered orbit ring markers */}
        {[
          { cx: 520, cy: 450, r: 10 },
          { cx: 1080, cy: 450, r: 10 },
          { cx: 380, cy: 340, r: 12 },
          { cx: 1220, cy: 340, r: 12 },
          { cx: 240, cy: 200, r: 10 },
          { cx: 1360, cy: 200, r: 10 },
        ].map((c, i) => (
          <circle
            key={i}
            cx={c.cx}
            cy={c.cy}
            r={c.r}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.18"
          />
        ))}
      </svg>
    </div>
  )
}

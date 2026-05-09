import { ReactNode } from 'react'

interface SectionFrameProps {
  children: ReactNode
  className?: string
  showTop?: boolean
  showBottom?: boolean
}

export default function SectionFrame({
  children,
  className = '',
  showTop = true,
  showBottom = true,
}: SectionFrameProps) {
  return (
    <div className={`relative w-full ${className}`}>
      {/* Full-width top line */}
      {showTop && (
        <div className="absolute top-0 left-0 right-0 h-px bg-warm-border" />
      )}

      {/* Inner box — left/right borders only */}
      <div className="relative max-w-cinema mx-auto border-l border-r border-warm-border">
        {/* Corner dot — top-left */}
        {showTop && (
          <div className="absolute -top-[7px] -left-[10px] w-5 h-5 rounded-full bg-cream-50">
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-black" />
          </div>
        )}

        {/* Corner dot — top-right */}
        {showTop && (
          <div className="absolute -top-[7px] -right-[10px] w-5 h-5 rounded-full bg-cream-50">
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-black" />
          </div>
        )}

        {/* Corner dot — bottom-left */}
        {showBottom && (
          <div className="absolute -bottom-[10px] -left-[10px] w-5 h-5 rounded-full bg-cream-50 z-20">
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-black" />
          </div>
        )}

        {/* Corner dot — bottom-right */}
        {showBottom && (
          <div className="absolute -bottom-[10px] -right-[10px] w-5 h-5 rounded-full bg-cream-50 z-20">
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-black" />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>

      {/* Full-width bottom line */}
      {showBottom && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-warm-border" />
      )}
    </div>
  )
}

import { ReactNode } from 'react'

interface SectionFrameProps {
  children: ReactNode
  className?: string
  innerClassName?: string
}

export default function SectionFrame({
  children,
  className = '',
  innerClassName = '',
}: SectionFrameProps) {
  return (
    <div className={`relative w-full ${className}`}>
      {/* Inner bordered box (centered, max-width) */}
      <div
        className={`relative max-w-cinema mx-auto border border-warm-border rounded-[20px] ${innerClassName}`}
      >
        {/* Corner dot — top-left */}
        <span className="absolute -top-[3px] -left-[3px] w-[6px] h-[6px] rounded-full bg-warm-light" />

        {/* Corner dot — top-right */}
        <span className="absolute -top-[3px] -right-[3px] w-[6px] h-[6px] rounded-full bg-warm-light" />

        {/* Corner dot — bottom-left */}
        <span className="absolute -bottom-[3px] -left-[3px] w-[6px] h-[6px] rounded-full bg-warm-light" />

        {/* Corner dot — bottom-right */}
        <span className="absolute -bottom-[3px] -right-[3px] w-[6px] h-[6px] rounded-full bg-warm-light" />

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  )
}

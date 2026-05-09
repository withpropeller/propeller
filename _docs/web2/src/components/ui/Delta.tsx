interface DeltaProps {
  children: React.ReactNode
  className?: string
}

export function Delta({ children, className }: DeltaProps) {
  return (
    <p className={`text-xs text-content-tertiary ${className ?? ''}`}>{children}</p>
  )
}

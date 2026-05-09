interface StatValueProps {
  children: React.ReactNode
  className?: string
}

export function StatValue({ children, className }: StatValueProps) {
  return (
    <p className={`text-2xl font-bold text-content-primary ${className ?? ''}`}>{children}</p>
  )
}

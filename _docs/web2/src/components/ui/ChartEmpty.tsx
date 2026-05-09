interface ChartEmptyProps {
  message?: string
}

export function ChartEmpty({ message = 'No data available' }: ChartEmptyProps) {
  return (
    <div className="flex items-center justify-center h-48 text-content-tertiary text-sm">
      {message}
    </div>
  )
}

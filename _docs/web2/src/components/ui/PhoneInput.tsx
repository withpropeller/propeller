interface PhoneInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  error?: string
}

export function PhoneInput({ id, value, onChange, error }: PhoneInputProps) {
  return (
    <div>
      <div className="flex rounded-lg border border-border-primary-main bg-surface-primary focus-within:ring-2 focus-within:ring-action-primary-main focus-within:border-transparent">
        <span className="flex items-center px-3 text-sm text-content-secondary border-r border-border-primary-light bg-surface-secondary rounded-l-lg">
          +234
        </span>
        <input
          id={id}
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="801 234 5678"
          className="flex-1 px-3 py-2.5 rounded-r-lg text-sm bg-transparent text-content-primary placeholder:text-content-tertiary focus:outline-none"
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-feedback-danger-main">{error}</p>
      )}
    </div>
  )
}

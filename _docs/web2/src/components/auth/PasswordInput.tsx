interface PasswordInputProps {
  id: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  autoComplete?: string
  required?: boolean
  error?: string
}

export function PasswordInput({ id, value, onChange, autoComplete, required, error }: PasswordInputProps) {
  return (
    <div>
      <input
        id={id}
        type="password"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        placeholder="••••••••"
        className={`w-full px-3 py-2.5 rounded-lg border text-sm bg-surface-primary text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-action-primary-main focus:border-transparent ${
          error ? 'border-feedback-danger-main' : 'border-border-primary-main'
        }`}
      />
      {error && (
        <p className="mt-1 text-xs text-feedback-danger-main">{error}</p>
      )}
    </div>
  )
}

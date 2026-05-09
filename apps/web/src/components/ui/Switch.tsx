'use client'

import { forwardRef } from 'react'
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
}

const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, disabled = false, className, id }, ref) => {
    return (
      <button
        ref={ref}
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary-main focus-visible:ring-offset-2',
          checked
            ? 'bg-action-primary-main'
            : 'bg-border-primary-light',
          disabled && 'cursor-not-allowed opacity-50',
          !disabled && 'cursor-pointer',
          className,
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-4.5 w-4.5 rounded-full bg-white shadow-whisper ring-0 transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    )
  }
)

Switch.displayName = 'Switch'

export { Switch }

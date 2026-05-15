'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { Check } from 'lucide-react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  onCheckedChange?: (checked: boolean) => void
}

export const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox(
  { className, onCheckedChange, onChange, checked, ...rest },
  ref,
) {
  return (
    <span className={`relative inline-flex items-center justify-center size-[18px] shrink-0 mt-[1px] ${className ?? ''}`}>
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          onChange?.(e)
          onCheckedChange?.(e.target.checked)
        }}
        className="peer absolute inset-0 size-full opacity-0 cursor-pointer"
        {...rest}
      />
      <span
        aria-hidden
        className={
          'size-[18px] rounded-[5px] border-[1.5px] transition-all duration-[140ms] flex items-center justify-center ' +
          'border-line-strong bg-white ' +
          'peer-hover:border-ink-soft ' +
          'peer-focus-visible:ring-4 peer-focus-visible:ring-[rgba(62,89,243,0.24)] ' +
          'peer-checked:bg-propeller-blue peer-checked:border-propeller-blue ' +
          'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed'
        }
      >
        <Check
          size={12}
          strokeWidth={3}
          className={`text-white transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`}
        />
      </span>
    </span>
  )
})

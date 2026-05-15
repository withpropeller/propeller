'use client'

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean
  iconRight?: ReactNode
}

const base =
  'w-full h-[46px] px-[14px] text-[15px] text-ink placeholder:text-ink-soft/70 ' +
  'bg-white border rounded-[12px] ' +
  'transition-all duration-[220ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ' +
  'focus:outline-none ' +
  'disabled:bg-mist disabled:text-ink-soft disabled:cursor-not-allowed'

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, iconRight, ...rest },
  ref,
) {
  const borderState = error
    ? 'border-propeller-coral focus:border-propeller-coral focus:shadow-[0_0_0_4px_rgba(228,63,111,0.20)]'
    : 'border-line-strong hover:border-ink-soft focus:border-propeller-blue focus:shadow-[0_0_0_4px_rgba(62,89,243,0.20)]'

  if (iconRight) {
    return (
      <div className="relative">
        <input
          ref={ref}
          className={`${base} ${borderState} pr-[44px] ${className ?? ''}`}
          {...rest}
        />
        <div className="absolute right-[6px] top-[6px] size-[34px] flex items-center justify-center text-ink-soft">
          {iconRight}
        </div>
      </div>
    )
  }

  return (
    <input
      ref={ref}
      className={`${base} ${borderState} ${className ?? ''}`}
      {...rest}
    />
  )
})

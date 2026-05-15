'use client'

import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  block?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap ' +
  'rounded-full transition-all duration-[220ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ' +
  'select-none cursor-pointer ' +
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(62,89,243,0.24)] ' +
  'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none'

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[14px]',
  md: 'h-11 px-5 text-[15px]',
  lg: 'px-[22px] py-[14px] text-[15px]',
}

const variants: Record<Variant, string> = {
  primary: 'bg-propeller-blue text-white hover:bg-propeller-blue-hover active:bg-propeller-blue-deep',
  secondary: 'bg-white text-ink border border-line-strong hover:border-ink',
  ghost: 'bg-transparent text-ink hover:bg-mist',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'lg', loading, iconLeft, iconRight, block, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${block ? 'w-full' : ''} ${className ?? ''}`}
      {...rest}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        iconLeft && <span className="inline-flex">{iconLeft}</span>
      )}
      <span>{children}</span>
      {iconRight && !loading && <span className="inline-flex">{iconRight}</span>}
    </button>
  )
})

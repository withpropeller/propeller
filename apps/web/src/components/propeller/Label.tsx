import { LabelHTMLAttributes } from 'react'

export function Label({ className, ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`block text-[13px] font-semibold text-ink whitespace-nowrap ${className ?? ''}`}
      {...rest}
    />
  )
}

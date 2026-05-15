'use client'

import { forwardRef, InputHTMLAttributes, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from './Input'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  error?: boolean
}

export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(
  props,
  ref,
) {
  const [visible, setVisible] = useState(false)
  return (
    <Input
      ref={ref}
      type={visible ? 'text' : 'password'}
      iconRight={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          tabIndex={-1}
          className="flex items-center justify-center size-[34px] rounded-[10px] text-ink-soft hover:bg-mist transition-colors"
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      }
      {...props}
    />
  )
})

'use client'

import { useEffect, useRef, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react'

type Props = {
  length?: number
  value: string
  onChange: (v: string) => void
  onComplete?: (v: string) => void
  disabled?: boolean
  error?: boolean
  autoFocus?: boolean
  ariaLabel?: string
}

export function PinInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled,
  error,
  autoFocus,
  ariaLabel = 'One-time code',
}: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus()
  }, [autoFocus])

  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  function setAt(i: number, digit: string) {
    const next = digits.slice()
    next[i] = digit
    const joined = next.join('').slice(0, length)
    onChange(joined)
    if (joined.length === length && !joined.includes(' ') && joined.replace(/\s/g, '').length === length) {
      onComplete?.(joined)
    }
  }

  function handleChange(i: number, e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '')
    if (!raw) {
      setAt(i, '')
      return
    }
    if (raw.length === 1) {
      setAt(i, raw)
      if (i < length - 1) refs.current[i + 1]?.focus()
    } else {
      // multi-char paste into single field
      const next = (value.slice(0, i) + raw).slice(0, length)
      onChange(next)
      const focusIdx = Math.min(i + raw.length, length - 1)
      refs.current[focusIdx]?.focus()
      if (next.length === length) onComplete?.(next)
    }
  }

  function handleKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault()
      refs.current[i - 1]?.focus()
      setAt(i - 1, '')
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus()
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      refs.current[i + 1]?.focus()
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const raw = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!raw) return
    e.preventDefault()
    onChange(raw)
    refs.current[Math.min(raw.length, length - 1)]?.focus()
    if (raw.length === length) onComplete?.(raw)
  }

  const borderState = error
    ? 'border-[#CE2121] focus:border-[#CE2121] focus:shadow-[0_0_0_1px_rgba(206,33,33,0.35)]'
    : 'border-warm-border focus:border-propeller-blue focus:shadow-[0_0_0_1px_rgba(62,89,243,0.35)]'

  return (
    <div role="group" aria-label={ariaLabel} className="flex w-full gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={d}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.currentTarget.select()}
          className={
            'flex-1 min-w-0 aspect-square text-center text-lg font-semibold tabular-nums ' +
            'bg-white border rounded-[6px] text-warm-text ' +
            'transition-[border-color,box-shadow,background-color] duration-150 ' +
            'focus:outline-none disabled:bg-cream-100 disabled:text-warm-muted ' +
            borderState
          }
        />
      ))}
    </div>
  )
}

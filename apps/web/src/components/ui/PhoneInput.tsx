'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'
import { COUNTRIES } from '@/lib/constants'

const UNIQUE_COUNTRIES = COUNTRIES.filter(
  (c, i, arr) => arr.findIndex((x) => x.code === c.code) === i,
)

function Flag({ code, className }: { code: string; className?: string }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w80/${code.toLowerCase()}.png 2x`}
      alt={code}
      width={16}
      height={16}
      className={`rounded-full object-cover shrink-0 ${className ?? ''}`}
    />
  )
}

// Parse a full phone string (e.g. "+234 801 234 5678") into country + local parts
function parseValue(value: string): { countryCode: string; local: string } {
  const defaultCode = 'NG'
  if (!value || !value.startsWith('+')) return { countryCode: defaultCode, local: value ?? '' }

  // Greedily match the longest dial code first to avoid "+1" matching "+1868" etc.
  const sorted = [...UNIQUE_COUNTRIES].sort(
    (a, b) => b.dialCode.length - a.dialCode.length,
  )
  for (const c of sorted) {
    if (value.startsWith(c.dialCode)) {
      const local = value.slice(c.dialCode.length).replace(/^\s+/, '')
      return { countryCode: c.code, local }
    }
  }
  return { countryCode: defaultCode, local: value }
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  'aria-invalid'?: boolean
}

export function PhoneInput({
  value,
  onChange,
  placeholder = '801 234 5678',
  disabled,
  'aria-invalid': ariaInvalid,
}: PhoneInputProps) {
  const { countryCode: initCode, local: initLocal } = parseValue(value)

  const [selectedCode, setSelectedCode] = useState(initCode)
  const [localValue, setLocalValue] = useState(initLocal)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const country =
    UNIQUE_COUNTRIES.find((c) => c.code === selectedCode) ?? UNIQUE_COUNTRIES[0]

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  // Auto-focus search when dropdown opens
  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  const filtered = UNIQUE_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dialCode.includes(search),
  )

  function handleCountrySelect(code: string) {
    const c = UNIQUE_COUNTRIES.find((x) => x.code === code)!
    setSelectedCode(code)
    setOpen(false)
    setSearch('')
    onChange(localValue ? `${c.dialCode}${localValue}` : '')
  }

  function handleLocalChange(raw: string) {
    // Allow only digits and spaces; strip any leading zeros
    const cleaned = raw.replace(/[^\d\s]/g, '').replace(/^0+/, '')
    setLocalValue(cleaned)
    onChange(cleaned ? `${country.dialCode}${cleaned}` : '')
  }

  const fieldBase =
    'h-10 rounded-lg border bg-surface-primary shadow-whisper transition-[color,box-shadow]'
  const fieldBorder = 'border-border-primary-main'
  const fieldDisabled = 'disabled:bg-surface-secondary disabled:cursor-not-allowed disabled:text-content-quaternary'

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-1.5 w-full">
        {/* Country trigger pill */}
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={`${fieldBase} ${fieldBorder} ${fieldDisabled} flex items-center justify-between gap-1.5 shrink-0 px-3 py-2.5 focus-visible:border-border-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring`}
        >
          <span className="text-sm text-content-secondary tabular-nums">
            {country.dialCode}
          </span>
          <ChevronDown
            width={12}
            height={12}
            className={`text-content-secondary transition-transform duration-150 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Number input */}
        <input
          type="tel"
          value={localValue}
          onChange={(e) => handleLocalChange(e.target.value)}
          placeholder={placeholder}
          maxLength={11}
          disabled={disabled}
          aria-invalid={ariaInvalid || undefined}
          className={`${fieldBase} ${fieldBorder} ${fieldDisabled} flex-1 min-w-0 px-3 py-2.5 font-base text-sm leading-[3] text-content-primary placeholder:text-content-quaternary focus-visible:border-border-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring aria-invalid:border-border-danger aria-invalid:outline-focus-ring`}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full bg-surface-primary border border-border-primary-light rounded-lg shadow-elevate p-1.5">
          {/* Search */}
          <div className="flex items-center gap-1.5 rounded-lg border border-border-primary-main bg-surface-primary px-3 py-2.5 shadow-whisper">
            <Search size={12} className="text-content-secondary shrink-0" strokeWidth={2.5} />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="flex-1 min-w-0 text-sm bg-transparent outline-none text-content-secondary placeholder:text-content-secondary"
            />
          </div>

          {/* Rows */}
          <div className="mt-1 max-h-56 overflow-y-auto flex flex-col gap-0.5">
            {filtered.length === 0 ? (
              <p className="px-1.5 py-2 text-sm text-content-tertiary">
                No countries found
              </p>
            ) : (
              filtered.map((c) => {
                const selected = c.code === selectedCode
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCountrySelect(c.code)}
                    className={`w-full flex items-center gap-2 px-1.5 py-1 rounded-md text-sm text-left transition-colors ${
                      selected ? 'bg-surface-secondary' : 'hover:bg-surface-secondary'
                    }`}
                  >
                    <Flag code={c.code} />
                    <span className="flex-1 truncate text-content-secondary">
                      {c.name}{' '}
                      <span className="text-content-tertiary">{c.dialCode}</span>
                    </span>
                    {selected && (
                      <Check
                        size={12}
                        className="text-content-secondary shrink-0"
                        strokeWidth={2.5}
                      />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

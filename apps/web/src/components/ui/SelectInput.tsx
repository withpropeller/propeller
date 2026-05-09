'use client'

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  type ReactNode,
  type KeyboardEvent,
} from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'

/* ── Types ──────────────────────────────────────────────── */
export interface SelectOption {
  label: string
  value: string
  description?: string
  icon?: ReactNode
  disabled?: boolean
}

export interface SelectInputProps {
  /** Options to display in the dropdown */
  options: SelectOption[]
  /** Currently selected value */
  value: string
  /** Called when a value is selected */
  onChange: (value: string) => void
  /** Placeholder shown when nothing is selected */
  placeholder?: string
  /** Field label rendered above the trigger */
  label?: string
  /** Helper text rendered below the trigger */
  helperText?: string
  /** Enable a search input inside the dropdown */
  searchable?: boolean
  /** Placeholder text for the search input */
  searchPlaceholder?: string
  /** External search value (makes search controlled — use with onSearchChange) */
  searchValue?: string
  /** Called on search input change when searchValue is controlled */
  onSearchChange?: (v: string) => void
  /** Show a loading spinner instead of the options list */
  loading?: boolean
  /** Message shown when the filtered list is empty */
  emptyMessage?: string
  /** Disables the entire control */
  disabled?: boolean
  /** Additional class on the trigger button */
  className?: string
  /** Allow clearing the selection */
  clearable?: boolean
}

/* ── Component ──────────────────────────────────────────── */
const SelectInput = forwardRef<HTMLButtonElement, SelectInputProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Select an option',
      label,
      helperText,
      searchable = false,
      searchPlaceholder = 'Search…',
      searchValue,
      onSearchChange,
      loading = false,
      emptyMessage = 'No options found',
      disabled = false,
      className = '',
      clearable = false,
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false)
    const [internalSearch, setInternalSearch] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLUListElement>(null)
    const [activeIndex, setActiveIndex] = useState(-1)

    // Controlled vs uncontrolled search
    const isControlledSearch = searchValue !== undefined
    const search = isControlledSearch ? (searchValue ?? '') : internalSearch
    const setSearch = isControlledSearch
      ? (v: string) => onSearchChange?.(v)
      : (v: string) => setInternalSearch(v)

    // Client-side filter (only when not controlled)
    const filtered = isControlledSearch
      ? options
      : searchable && search
        ? options.filter(
            (o) =>
              o.label.toLowerCase().includes(search.toLowerCase()) ||
              o.description?.toLowerCase().includes(search.toLowerCase()),
          )
        : options

    const selected = options.find((o) => o.value === value)

    // Close on outside click
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Focus search when opening
    useEffect(() => {
      if (open && searchable) {
        setTimeout(() => searchRef.current?.focus(), 50)
      }
      if (!open) {
        setInternalSearch('')
        setActiveIndex(-1)
      }
    }, [open, searchable])

    const handleSelect = useCallback(
      (opt: SelectOption) => {
        if (opt.disabled) return
        onChange(opt.value)
        setOpen(false)
      },
      [onChange],
    )

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange('')
    }

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (!open) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault()
          setOpen(true)
        }
        return
      }
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault()
        const opt = filtered[activeIndex]
        if (opt) handleSelect(opt)
      }
    }

    // Scroll active item into view
    useEffect(() => {
      if (activeIndex >= 0 && listRef.current) {
        const item = listRef.current.children[activeIndex] as HTMLElement
        item?.scrollIntoView({ block: 'nearest' })
      }
    }, [activeIndex])

    return (
      <div ref={containerRef} className="w-full" onKeyDown={handleKeyDown}>
        {/* Label */}
        {label && (
          <label className="block text-xs font-semibold text-content-secondary mb-1.5">
            {label}
          </label>
        )}

        {/* Trigger */}
        <button
          ref={ref}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          onClick={() => !disabled && setOpen((v) => !v)}
          className={[
            'relative w-full flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm text-left transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-action-primary-main',
            open
              ? 'border-action-primary-main bg-surface-primary'
              : 'border-border-primary-light bg-surface-primary hover:border-content-quaternary',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
            className,
          ].join(' ')}
        >
          <span
            className={[
              'flex items-center gap-2 min-w-0',
              selected ? 'text-content-primary' : 'text-content-quaternary',
            ].join(' ')}
          >
            {selected?.icon && (
              <span className="shrink-0 text-content-secondary">{selected.icon}</span>
            )}
            <span className="truncate">{selected?.label ?? placeholder}</span>
          </span>

          <span className="flex items-center gap-1 shrink-0">
            {clearable && value && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                onMouseDown={handleClear}
                className="p-0.5 rounded text-content-quaternary hover:text-content-primary hover:bg-surface-secondary transition-colors"
              >
                <X width={12} height={12} />
              </span>
            )}
            <ChevronDown
              width={14}
              height={14}
              className={[
                'text-content-tertiary transition-transform duration-200',
                open ? 'rotate-180' : '',
              ].join(' ')}
            />
          </span>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="relative z-50">
            <div className="absolute top-1.5 left-0 right-0 bg-surface-primary border border-border-primary-light rounded-xl shadow-elevate overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
              {/* Search */}
              {searchable && (
                <div className="p-2 border-b border-border-primary-light">
                  <div className="relative">
                    <Search
                      width={13}
                      height={13}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-quaternary pointer-events-none"
                    />
                    <input
                      ref={searchRef}
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={searchPlaceholder}
                      className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-border-primary-light bg-surface-secondary text-content-primary placeholder:text-content-quaternary focus:outline-none focus:ring-1 focus:ring-action-primary-main"
                    />
                    {search && (
                      <button
                        type="button"
                        onMouseDown={() => setSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-content-quaternary hover:text-content-primary"
                      >
                        <X width={11} height={11} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Options */}
              <ul
                ref={listRef}
                role="listbox"
                aria-label={label}
                className="max-h-52 overflow-y-auto py-1"
              >
                {loading ? (
                  <li className="px-4 py-6 text-center text-sm text-content-tertiary">
                    <span className="inline-block w-4 h-4 border-2 border-action-primary-main border-t-transparent rounded-full animate-spin mr-2 align-middle" />
                    Loading…
                  </li>
                ) : filtered.length === 0 ? (
                  <li className="px-4 py-6 text-center text-sm text-content-tertiary">
                    {emptyMessage}
                  </li>
                ) : (
                  filtered.map((opt, i) => {
                    const isSelected = opt.value === value
                    const isActive = i === activeIndex
                    return (
                      <li
                        key={opt.value}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={opt.disabled}
                        onMouseEnter={() => setActiveIndex(i)}
                        onMouseDown={() => handleSelect(opt)}
                        className={[
                          'flex items-center justify-between gap-3 px-3 py-2.5 cursor-pointer select-none transition-colors',
                          opt.disabled
                            ? 'opacity-40 cursor-not-allowed'
                            : isActive || isSelected
                              ? 'bg-surface-secondary'
                              : 'hover:bg-surface-secondary/60',
                        ].join(' ')}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {opt.icon && (
                            <span className="shrink-0 text-content-secondary">{opt.icon}</span>
                          )}
                          <div className="min-w-0">
                            <p
                              className={[
                                'text-sm truncate',
                                isSelected ? 'font-semibold text-content-primary' : 'text-content-primary',
                              ].join(' ')}
                            >
                              {opt.label}
                            </p>
                            {opt.description && (
                              <p className="text-xs text-content-tertiary truncate mt-0.5">
                                {opt.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <Check width={14} height={14} className="shrink-0 text-action-primary-main" />
                        )}
                      </li>
                    )
                  })
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Helper text */}
        {helperText && (
          <p className="mt-1.5 text-xs text-content-tertiary">{helperText}</p>
        )}
      </div>
    )
  },
)

SelectInput.displayName = 'SelectInput'

export { SelectInput }

'use client'

import { Chip } from '@/lib/pax'

interface NetworkBadgeProps {
  value?: string | null
  className?: string
  /** Which logo variant to use when on a dark background */
  variant?: 'light' | 'dark'
  /** Show the network name next to the logo */
  showLabel?: boolean
}

export function NetworkBadge({
  value,
  className = '',
  variant = 'dark',
  showLabel = false,
}: NetworkBadgeProps) {
  const network = value?.toLowerCase()

  const getIcon = () => {
    if (network?.includes('mastercard')) {
      return (
        <img
          src="/assets/svg/mastercard.svg"
          alt="Mastercard"
          className="w-5 h-5 object-contain"
        />
      )
    }
    if (network?.includes('visa')) {
      return (
        <img
          src="/assets/svg/visa.svg"
          alt="Visa"
          className="w-5 h-5 object-contain"
        />
      )
    }
    if (network?.includes('verve')) {
      const src =
        variant === 'light' ? '/assets/svg/verve-dark.svg' : '/assets/svg/verve-light.svg'
      return <img src={src} alt="Verve" className="w-5 h-5 object-contain" />
    }
    return null
  }

  const icon = getIcon()
  const labelText = value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : '—'

  if (!icon) {
    return (
      <span className={`text-sm text-content-secondary capitalize ${className}`}>
        {labelText}
      </span>
    )
  }

  return (
    <Chip
      className={`gap-1.5 h-7 px-1.5 border border-border-primary-light bg-surface-primary ${className}`}
    >
      {icon}
      {showLabel && (
        <span className="text-xs font-medium text-content-secondary">{labelText}</span>
      )}
    </Chip>
  )
}

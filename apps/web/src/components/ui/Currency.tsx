import React from 'react'

const CURRENCY_TO_COUNTRY: Record<string, string> = {
  NGN: 'NG',
  USD: 'US',
  GBP: 'GB',
  EUR: 'EU',
  CAD: 'CA',
}

const CRYPTO_ICONS: Record<string, string> = {
  USDC: '🪙',
}

interface CurrencyProps {
  code: string
  className?: string
}

/**
 * Currency - A premium component for displaying currency codes with regional icons.
 * Typically used in financial tables and detail panels.
 */
export function Currency({ code, className = '' }: CurrencyProps) {
  if (!code) return <span className="text-content-tertiary"> — </span>

  const upCode = code.toUpperCase()
  const countryCode = CURRENCY_TO_COUNTRY[upCode]
  const cryptoIcon = CRYPTO_ICONS[upCode]

  return (
    <div className={`flex items-center gap-2.5 group ${className}`}>
      <div className="w-5 h-[14px] rounded-[2px] overflow-hidden bg-surface-secondary flex items-center justify-center shrink-0">
        {countryCode ? (
          <img
            src={`https://flagsapi.com/${countryCode.toUpperCase()}/flat/64.png`}
            alt={upCode}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-[10px] leading-none">{cryptoIcon || '🌐'}</span>
        )}
      </div>
      <span className="text-sm text-content-secondary">
        {upCode}
      </span>
    </div>
  )
}

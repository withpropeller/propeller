'use client'

import { ReactNode } from 'react'

type SSOItem = {
  id: string
  label: string
  icon: ReactNode
  onClick?: () => void
}

function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.61z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.95v2.32A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.96H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.04l3.02-2.32z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .95 4.96l3.02 2.32C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  )
}

function MicrosoftLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <path fill="#F25022" d="M0 0h7.5v7.5H0z" />
      <path fill="#7FBA00" d="M8.5 0H16v7.5H8.5z" />
      <path fill="#00A4EF" d="M0 8.5h7.5V16H0z" />
      <path fill="#FFB900" d="M8.5 8.5H16V16H8.5z" />
    </svg>
  )
}

function ShieldIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l8 3v6c0 4.5-3.4 8.4-8 9-4.6-.6-8-4.5-8-9V6l8-3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const defaultItems: SSOItem[] = [
  { id: 'google', label: 'Google', icon: <GoogleLogo /> },
  { id: 'ms', label: 'Microsoft', icon: <MicrosoftLogo /> },
  {
    id: 'sso',
    label: 'SSO',
    icon: <span className="text-propeller-navy"><ShieldIcon /></span>,
  },
]

export function SSORow({ items = defaultItems }: { items?: SSOItem[] }) {
  return (
    <>
      <div className="grid grid-cols-3 gap-2.5">
        {items.map((i) => (
          <button
            key={i.id}
            type="button"
            onClick={i.onClick}
            className={
              'flex items-center justify-center gap-2 ' +
              'bg-white border border-line-strong rounded-[12px] ' +
              'px-3.5 py-3 text-[14px] font-medium text-ink cursor-pointer ' +
              'transition-colors duration-[140ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ' +
              'hover:border-ink'
            }
          >
            {i.icon}
            <span>{i.label}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3.5 text-[12px] font-medium text-ink-soft my-5 whitespace-nowrap">
        <div className="flex-1 h-px bg-line" />
        <span>or continue with email</span>
        <div className="flex-1 h-px bg-line" />
      </div>
    </>
  )
}

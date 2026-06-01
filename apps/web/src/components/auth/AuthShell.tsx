'use client'

import Link from '@/lib/routing'
import { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { BrandPanel } from './BrandPanel'

type AuthShellProps = {
  children: ReactNode
  /** Render an inline back link top-right (instead of the alt-action). */
  onBack?: () => void
  /** Text and href for the top-right alt action (e.g. "Sign up"). Mutually exclusive with onBack. Pass null to hide. */
  altAction?: { label: string; href: string } | null
  /** Hide the brand panel — used for confirmation states that want full focus. */
  hideBrandPanel?: boolean
}

export function AuthShell({ children, onBack, altAction, hideBrandPanel }: AuthShellProps) {
  return (
    <div
      className={`min-h-screen bg-white ${
        hideBrandPanel ? 'flex' : 'grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'
      }`}
    >
      {/* Form side */}
      <div className="flex flex-col min-h-screen px-6 sm:px-10 md:px-12 pt-8 pb-12">
        <div className="flex items-center justify-between mb-12 md:mb-20">
          <Link href="/" className="flex items-center text-propeller-navy no-underline">
            <img src="/hyphen-logo-dark.svg" alt="Hyphen" className="h-[22px] w-auto" />
          </Link>

          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-ink-soft text-[13px] font-medium px-3 py-2 rounded-full transition-colors hover:text-ink"
            >
              <ArrowLeft size={14} />
              Back
            </button>
          ) : altAction ? (
            <Link
              href={altAction.href}
              className="text-ink-soft text-[13px] font-medium no-underline hover:text-ink transition-colors"
            >
              {altAction.label}
            </Link>
          ) : null}
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-[420px] mx-auto">{children}</div>
        </div>

        <div className="flex items-center justify-between gap-4 pt-8 text-[12px] text-ink-soft whitespace-nowrap">
          <div>&copy; {new Date().getFullYear()} Propeller Payments</div>
          <div className="flex gap-[18px]">
            <Link href="/legal/privacy" className="text-ink-soft no-underline hover:text-ink">
              Privacy
            </Link>
            <Link href="/legal/terms" className="text-ink-soft no-underline hover:text-ink">
              Terms
            </Link>
            <Link href="/status" className="text-ink-soft no-underline hover:text-ink">
              Status
            </Link>
          </div>
        </div>
      </div>

      {!hideBrandPanel && <BrandPanel />}
    </div>
  )
}

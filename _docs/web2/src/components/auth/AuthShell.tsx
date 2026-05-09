import { Link } from 'react-router-dom'
import { ReactNode } from 'react'
import { Button } from '@/lib/pax'

type AuthShellProps = {
  children: ReactNode
  altAction?: { label: string; href: string } | null
  bottomLayer?: ReactNode
}

export function AuthShell({ children, altAction, bottomLayer }: AuthShellProps) {
  return (
    <div className="relative min-h-screen flex flex-col bg-surface-primary overflow-hidden">
      {/* Background wave */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 auth-wave"
        style={{
          background:
            'radial-gradient(ellipse 40% 100% at 0% 100%, rgba(59, 130, 246, 0.22) 0%, rgba(59, 130, 246, 0.06) 40%, transparent 72%), radial-gradient(ellipse 40% 100% at 100% 100%, rgba(59, 130, 246, 0.22) 0%, rgba(59, 130, 246, 0.06) 40%, transparent 72%)',
        }}
      />
      {bottomLayer}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-20 py-6">
        <Link to="/" className="flex items-center" aria-label="Paystack Issuing home">
          <img src="/logo.svg" alt="Paystack Issuing" className="h-6" />
        </Link>
        {altAction && (
          <Button asChild variant="outline" color="secondary" size="sm">
            <Link to={altAction.href}>{altAction.label}</Link>
          </Button>
        )}
      </header>

      <main className="relative z-10 flex-1 flex items-start justify-center px-6 pt-16 pb-12">
        <div className="w-full max-w-[392px]">{children}</div>
      </main>
    </div>
  )
}

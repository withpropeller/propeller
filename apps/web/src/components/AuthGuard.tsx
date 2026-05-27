'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from '@/lib/routing'
import { useAuth } from '@/context/AuthContext'

interface AuthGuardProps {
  children: React.ReactNode
}

/**
 * AuthGuard - Protects routes by redirecting unauthenticated users to /auth/login
 * 
 * Usage: Wrap pages that require authentication with this component
 * Or use it in layout.tsx to protect entire sections
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store the attempted path to redirect back after login
      const returnTo = pathname !== '/auth/login' ? pathname : '/'
      router.push(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`)
    }
  }, [isAuthenticated, isLoading, router, pathname])

  // Show nothing while checking auth or redirecting
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action-primary-main"></div>
      </div>
    )
  }

  return <>{children}</>
}

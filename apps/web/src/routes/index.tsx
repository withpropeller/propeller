'use client'

import { useEffect } from 'react'
import { useRouter } from '@/lib/routing'
import { useAuth } from '@/context/AuthContext'
import { Skeleton } from '@/lib/pax'

/**
 * Root landing page
 * 
 * Redirects based on authentication status:
 * - Authenticated users → /dashboard
 * - Unauthenticated users → /login
 */
export default function Index() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace('/dashboard')
      } else {
        router.replace('/auth/login')
      }
    }
  }, [user, isLoading, router])

  // Show loading state during redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-primary">
      <div className="space-y-4 text-center">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
  )
}

import { ReactNode } from 'react'
import { AuthGuard } from '@/components/AuthGuard'
import { AppShell } from '@/components/layout/AppShell'

interface DashboardLayoutProps {
  children: ReactNode
}

/**
 * Dashboard layout
 * 
 * Wraps all /dashboard/* routes with:
 * - AuthGuard: Requires authentication, redirects to /login
 * - AppShell: Sidebar + panel layout structure
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  )
}

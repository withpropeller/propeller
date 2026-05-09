import { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { AuthGuard } from '@/components/AuthGuard'
import { AppShell } from '@/components/layout/AppShell'

/**
 * Dashboard layout — wraps all /dashboard/* routes with:
 * - AuthGuard: Requires authentication
 * - AppShell: Sidebar + panel layout structure
 */
export default function DashboardLayout() {
  return (
    <AuthGuard>
      <AppShell>
        <Outlet />
      </AppShell>
    </AuthGuard>
  )
}

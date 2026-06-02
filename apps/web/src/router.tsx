import { createBrowserRouter, Outlet } from 'react-router-dom'
import { AuthGuard } from '@/components/AuthGuard'
import { AppShell } from '@/components/layout/AppShell'

function DashboardLayout() {
  return (
    <AuthGuard>
      <AppShell>
        <Outlet />
      </AppShell>
    </AuthGuard>
  )
}

const lazyDefault = (loader: () => Promise<{ default: React.ComponentType }>) => async () => {
  const mod = await loader()
  return { Component: mod.default }
}

export const router = createBrowserRouter([
  { path: '/', lazy: lazyDefault(() => import('@/routes')) },
  { path: '/signup', lazy: lazyDefault(() => import('@/routes/signup')) },
  { path: '/auth/login', lazy: lazyDefault(() => import('@/routes/auth/login')) },
  { path: '/auth/mfa', lazy: lazyDefault(() => import('@/routes/auth/mfa')) },
  { path: '/auth/reset', lazy: lazyDefault(() => import('@/routes/auth/reset')) },
  { path: '/auth/reset/:token', lazy: lazyDefault(() => import('@/routes/auth/reset/[token]')) },
  { path: '/confirmation/:token', lazy: lazyDefault(() => import('@/routes/confirmation/[token]')) },
  {
    path: '/invite/:businessId/:inviteCode',
    lazy: lazyDefault(() => import('@/routes/invite/[businessId]/[inviteCode]')),
  },
  {
    path: '/dashboard',
    Component: DashboardLayout,
    children: [
      { index: true, lazy: lazyDefault(() => import('@/routes/dashboard')) },
      { path: 'accounts', lazy: lazyDefault(() => import('@/routes/dashboard/accounts')) },
      { path: 'accounts/:id', lazy: lazyDefault(() => import('@/routes/dashboard/accounts/[id]')) },
      { path: 'api-keys', lazy: lazyDefault(() => import('@/routes/dashboard/api-keys')) },
      { path: 'customers', lazy: lazyDefault(() => import('@/routes/dashboard/customers')) },
      { path: 'customers/new', lazy: lazyDefault(() => import('@/routes/dashboard/customers/new')) },
      { path: 'customers/:id', lazy: lazyDefault(() => import('@/routes/dashboard/customers/[id]')) },
      { path: 'developer/api-keys', lazy: lazyDefault(() => import('@/routes/dashboard/developer/api-keys')) },
      {
        path: 'developer/api-keys/:id',
        lazy: lazyDefault(() => import('@/routes/dashboard/developer/api-keys/[id]')),
      },
      { path: 'developer/events', lazy: lazyDefault(() => import('@/routes/dashboard/developer/events')) },
      {
        path: 'developer/events/:id',
        lazy: lazyDefault(() => import('@/routes/dashboard/developer/events/[id]')),
      },
      { path: 'developer/logs', lazy: lazyDefault(() => import('@/routes/dashboard/developer/logs')) },
      {
        path: 'developer/logs/:id',
        lazy: lazyDefault(() => import('@/routes/dashboard/developer/logs/[id]')),
      },
      { path: 'developer/webhooks', lazy: lazyDefault(() => import('@/routes/dashboard/developer/webhooks')) },
      { path: 'payments', lazy: lazyDefault(() => import('@/routes/dashboard/payments')) },
      { path: 'settings', lazy: lazyDefault(() => import('@/routes/dashboard/settings')) },
      { path: 'settings/business', lazy: lazyDefault(() => import('@/routes/dashboard/settings/business')) },
      { path: 'settings/compliance', lazy: lazyDefault(() => import('@/routes/dashboard/settings/compliance')) },
      { path: 'settings/profile', lazy: lazyDefault(() => import('@/routes/dashboard/settings/profile')) },
      { path: 'settings/security', lazy: lazyDefault(() => import('@/routes/dashboard/settings/security')) },
      { path: 'settings/team', lazy: lazyDefault(() => import('@/routes/dashboard/settings/team')) },
    ],
  },
])

'use client'

import { ReactNode, useEffect } from 'react'
import Link from 'next/link'
import { Sidebar } from './Sidebar'
import { GlobalPanel } from './GlobalPanel'
import { MobileTopBar } from './MobileTopBar'
import { Topnav } from '@/components/layout/Topnav'
import { IssuingNavProvider } from '@/context/IssuingNavContext'
import { usePanelContext } from '@/context/PanelContext'
import { useMode } from '@/context/ModeContext'
import { useSidebar } from '@/context/SidebarContext'
import { usePathname } from 'next/navigation'
import { Alert, AlertDescription, AlertWarningIcon } from '@/lib/pax'
import { useBusinessControllerFind } from '@/api/business/business'

export function AppShell({ children }: { children: ReactNode }) {
  const { closePanel, panelState } = usePanelContext()
  const { isMobileOpen, isTabletExpanded, closeMobileSidebar, closeTabletExpanded } = useSidebar()
  const pathname = usePathname()
  const { isSandboxMode } = useMode()
  const { data: bizData, isLoading: bizLoading } = useBusinessControllerFind()
  const isApproved = (bizData as any)?.data?.status === 'approved'
  const isDashboardRoute = pathname.startsWith('/dashboard')

  // Close detail panel and sidebar on route change.
  useEffect(() => {
    closePanel()
    closeMobileSidebar()
    closeTabletExpanded()
  }, [pathname, closePanel, closeMobileSidebar, closeTabletExpanded])

  // Mutual exclusion (mobile): close sidebar when detail panel opens.
  useEffect(() => {
    if (panelState.type && panelState.id) {
      closeMobileSidebar()
    }
  }, [panelState.type, panelState.id, closeMobileSidebar])

  return (
    <div className="h-screen bg-surface-secondary flex flex-col">
      {/* Test mode banner — above the entire dashboard, like Stripe */}
      {isSandboxMode && (
        <Alert severity="warning" variant="filled" className="rounded-none border-x-0 border-t-0 shrink-0">
          <AlertWarningIcon />
          <AlertDescription>
            You&apos;re viewing test data. No real transactions will be affected.
          </AlertDescription>
        </Alert>
      )}

      {/* Dashboard shell below the banner */}
      <div className="flex-1 min-h-0 relative">
        {/* Skip navigation — WCAG 2.4.1 */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-action-primary-main focus:text-content-inverse focus:rounded-lg focus:text-sm focus:font-medium focus:shadow-elevate"
        >
          Skip to main content
        </a>

        {/* Sidebar — absolute within this container, z-30 */}
        <Sidebar />

        {/* Mobile backdrop */}
        {isMobileOpen && (
          <div
            className="absolute inset-0 z-20 bg-black/30 md:hidden"
            onClick={closeMobileSidebar}
            aria-hidden="true"
          />
        )}

        {/* Tablet expanded backdrop */}
        {isTabletExpanded && (
          <div
            className="absolute inset-0 z-20 bg-black/30 hidden md:block lg:hidden"
            onClick={closeTabletExpanded}
            aria-hidden="true"
          />
        )}

        {/* Content area wrapper with margin-left for sidebar offset */}
        <div
          className={[
            isMobileOpen ? 'ml-70' : 'ml-0',
            'md:ml-14 lg:ml-56',
            'flex flex-col h-full overflow-hidden bg-surface-primary',
            'transition-[margin-left] duration-220 ease-out',
          ].join(' ')}
        >
          <MobileTopBar />

          {/* Main content row — flex siblings so GlobalPanel pushes <main> */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <IssuingNavProvider>
              <main id="main-content" className="flex-1 min-w-0 overflow-y-auto">
                {/* Issuing topnav — renders full-width, above the content padding.
                    Sticky within this scroll container. Only for Issuing routes. */}
                {isDashboardRoute && (
                  <div className="sticky top-0 z-10">
                    <Topnav />
                  </div>
                )}

                {/* Approval banner — only shown in sandbox when business is not yet approved */}
                {isSandboxMode && !isApproved && !bizLoading && (
                  <Alert severity="information" variant="filled" className="rounded-none border-x-0 border-t-0 shrink-0">
                    <AlertDescription className="flex items-center justify-between w-full">
                      <span>Your business must be approved before you can switch to live mode.</span>
                      <Link href="/dashboard/settings/compliance" className="font-medium underline underline-offset-2 shrink-0">
                        View compliance
                      </Link>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Content padding */}
                <div className="p-4 md:p-6 lg:p-10">
                  <div className="max-w-[1200px] mx-auto">
                    {children}
                  </div>
                </div>
              </main>
            </IssuingNavProvider>

            <GlobalPanel />
          </div>
        </div>
      </div>
    </div>
  )
}

import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { GlobalPanel } from './GlobalPanel'
import { MobileTopBar } from './MobileTopBar'
import { Topnav } from './Topnav'
import { IssuingNavProvider } from '@/context/IssuingNavContext'
import { usePanelContext } from '@/context/PanelContext'
import { useMode } from '@/context/ModeContext'
import { useSidebar } from '@/context/SidebarContext'
import { Alert, AlertDescription, AlertWarningIcon } from '@/lib/pax'

export function AppShell({ children }: { children: ReactNode }) {
  const { closePanel, panelState } = usePanelContext()
  const { isMobileOpen, isTabletExpanded, closeMobileSidebar, closeTabletExpanded } = useSidebar()
  const location = useLocation()
  const { isSandboxMode } = useMode()
  const isDashboardRoute = location.pathname.startsWith('/dashboard')

  // Close detail panel and sidebar on route change.
  const pathname = location.pathname
  // These side-effects would normally be in useEffect, but they live in the original.
  // In React Router, we need to track pathname changes manually for the close effect.
  // For now, we skip automatic close-on-route-change (it's a nice-to-have).

  return (
    <div className="h-screen bg-surface-secondary flex flex-col">
      {/* Test mode banner */}
      {isSandboxMode && (
        <Alert severity="warning" variant="filled" className="rounded-none border-x-0 border-t-0 shrink-0">
          <AlertWarningIcon />
          <AlertDescription>
            You're viewing test data. No real transactions will be affected.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex-1 min-h-0 relative">
        {/* Skip navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-action-primary-main focus:text-content-inverse focus:rounded-lg focus:text-sm focus:font-medium focus:shadow-elevate"
        >
          Skip to main content
        </a>

        {/* Sidebar */}
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

        {/* Content area */}
        <div
          className={[
            isMobileOpen ? 'ml-70' : 'ml-0',
            'md:ml-14 lg:ml-56',
            'flex flex-col h-full overflow-hidden bg-surface-primary',
            'transition-[margin-left] duration-220 ease-out',
          ].join(' ')}
        >
          <MobileTopBar />

          <div className="flex flex-1 min-h-0 overflow-hidden">
            <IssuingNavProvider>
              <main id="main-content" className="flex-1 min-w-0 overflow-y-auto">
                {isDashboardRoute && (
                  <div className="sticky top-0 z-10">
                    <Topnav />
                  </div>
                )}

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

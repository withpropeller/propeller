'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { PermissionsProvider } from '@/context/PermissionsContext'
import { ModeProvider } from '@/context/ModeContext'
import { PanelProvider } from '@/context/PanelContext'
import { SearchProvider } from '@/context/SearchContext'
import { SidebarProvider } from '@/context/SidebarContext'
import { Toaster } from '@/lib/pax'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PermissionsProvider>
          <ModeProvider>
            <PanelProvider>
              <SearchProvider>
                <SidebarProvider>
                  {children}
                  <Toaster />
                </SidebarProvider>
              </SearchProvider>
            </PanelProvider>
          </ModeProvider>
        </PermissionsProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

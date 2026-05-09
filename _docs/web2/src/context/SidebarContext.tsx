import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

interface SidebarContextType {
  isMobileOpen: boolean
  isTabletExpanded: boolean
  openMobileSidebar: () => void
  closeMobileSidebar: () => void
  toggleTabletExpanded: () => void
  closeTabletExpanded: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isTabletExpanded, setIsTabletExpanded] = useState(false)

  const openMobileSidebar = useCallback(() => { setIsMobileOpen(true) }, [])
  const closeMobileSidebar = useCallback(() => { setIsMobileOpen(false) }, [])
  const toggleTabletExpanded = useCallback(() => { setIsTabletExpanded((v) => !v) }, [])
  const closeTabletExpanded = useCallback(() => { setIsTabletExpanded(false) }, [])

  return (
    <SidebarContext.Provider value={{
      isMobileOpen,
      isTabletExpanded,
      openMobileSidebar,
      closeMobileSidebar,
      toggleTabletExpanded,
      closeTabletExpanded,
    }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) throw new Error('useSidebar must be used within SidebarProvider')
  return context
}

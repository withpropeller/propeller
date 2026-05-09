'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

interface PanelState {
  type: string | null
  id: string | null
}

interface PanelContextType {
  panelState: PanelState
  openPanel: (type: string, id: string) => void
  closePanel: () => void
}

const PanelContext = createContext<PanelContextType | undefined>(undefined)

export function PanelProvider({ children }: { children: ReactNode }) {
  const [panelState, setPanelState] = useState<PanelState>({ type: null, id: null })

  const openPanel = useCallback((type: string, id: string) => {
    setPanelState((current) => {
      if (current.type === type && current.id === id) {
        return { type: null, id: null }
      } else {
        return { type, id }
      }
    })
  }, [])

  const closePanel = useCallback(() => {
    setPanelState({ type: null, id: null })
  }, [])

  return (
    <PanelContext.Provider value={{ panelState, openPanel, closePanel }}>
      {children}
    </PanelContext.Provider>
  )
}

export function usePanelContext() {
  const context = useContext(PanelContext)
  if (!context) throw new Error('usePanelContext must be used within PanelProvider')
  return context
}

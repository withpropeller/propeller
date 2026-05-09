'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { STORAGE_KEYS } from '@/lib/constants'

type Mode = 'live' | 'sandbox'

interface ModeContextType {
  mode: Mode
  setMode: (newMode: Mode) => void
  isSandboxMode: boolean
}

const ModeContext = createContext<ModeContextType | undefined>(undefined)

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>('sandbox')

  // Restore mode from localStorage (written on toggle). Sandbox is the default
  // for fresh sessions — logout clears the key so next login always starts in sandbox.
  useEffect(() => {
    const savedMode = localStorage.getItem(STORAGE_KEYS.DASHBOARD_MODE) as Mode
    if (savedMode === 'live' || savedMode === 'sandbox') {
      setModeState(savedMode)
    } else {
      // Nothing stored yet — persist the default so orvalClient reads it on every request.
      localStorage.setItem(STORAGE_KEYS.DASHBOARD_MODE, 'sandbox')
    }
  }, [])

  const setMode = (newMode: Mode) => {
    // Write to localStorage first — orvalClient reads it directly on every request.
    // Reload so all React Query cache is cleared and every in-flight
    // request starts fresh with the new x-dashboard-mode header value.
    localStorage.setItem(STORAGE_KEYS.DASHBOARD_MODE, newMode)
    window.location.reload()
  }

  return (
    <ModeContext.Provider
      value={{
        mode,
        setMode,
        isSandboxMode: mode === 'sandbox',
      }}
    >
      {children}
    </ModeContext.Provider>
  )
}

export function useMode() {
  const context = useContext(ModeContext)
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider')
  }
  return context
}

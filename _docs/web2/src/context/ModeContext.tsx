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

  useEffect(() => {
    const savedMode = localStorage.getItem(STORAGE_KEYS.DASHBOARD_MODE) as Mode
    if (savedMode === 'live' || savedMode === 'sandbox') {
      setModeState(savedMode)
    } else {
      localStorage.setItem(STORAGE_KEYS.DASHBOARD_MODE, 'sandbox')
    }
  }, [])

  const setMode = (newMode: Mode) => {
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
  if (!context) throw new Error('useMode must be used within ModeProvider')
  return context
}

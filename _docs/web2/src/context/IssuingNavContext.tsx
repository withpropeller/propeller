import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface IssuingNavContextType {
  pageTitle: string | null
  setPageTitle: (title: string | null) => void
}

const IssuingNavContext = createContext<IssuingNavContextType>({
  pageTitle: null,
  setPageTitle: () => {},
})

export function IssuingNavProvider({ children }: { children: ReactNode }) {
  const [pageTitle, setPageTitleState] = useState<string | null>(null)
  const setPageTitle = useCallback((title: string | null) => setPageTitleState(title), [])
  return (
    <IssuingNavContext.Provider value={{ pageTitle, setPageTitle }}>
      {children}
    </IssuingNavContext.Provider>
  )
}

export function useIssuingNav() {
  return useContext(IssuingNavContext)
}

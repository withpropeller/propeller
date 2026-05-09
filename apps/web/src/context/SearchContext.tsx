'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface RecentItem {
  type: 'transaction' | 'account' | 'customer' | 'recipient'
  id: string
}

interface SearchContextType {
  isOpen: boolean
  openSearch: () => void
  closeSearch: () => void
  recentItems: RecentItem[]
  addRecentItem: (type: RecentItem['type'], id: string) => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])

  const openSearch = useCallback(() => setIsOpen(true), [])
  const closeSearch = useCallback(() => setIsOpen(false), [])

  const addRecentItem = useCallback((type: RecentItem['type'], id: string) => {
    setRecentItems((prev) => {
      const without = prev.filter((r) => r.id !== id)
      return [{ type, id }, ...without].slice(0, 5)
    })
  }, [])

  return (
    <SearchContext.Provider value={{ isOpen, openSearch, closeSearch, recentItems, addRecentItem }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (!context) throw new Error('useSearch must be used within SearchProvider')
  return context
}

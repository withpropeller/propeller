'use client'

import { Menu, Search } from 'lucide-react'
import { useSidebar } from '@/context/SidebarContext'
import { useSearch } from '@/context/SearchContext'

export function MobileTopBar() {
  const { openMobileSidebar } = useSidebar()
  const { openSearch } = useSearch()

  return (
    <div className="md:hidden h-12 bg-[#0a0a0b] border-b border-white/5 flex items-center px-2 shrink-0 z-10 justify-between">
      <button
        onClick={openMobileSidebar}
        className="w-11 h-11 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer rounded-lg"
        aria-label="Open navigation menu"
      >
        <Menu size={18} strokeWidth={1.75} />
      </button>

      <span className="font-bold text-white text-sm">Allawee</span>

      <button
        onClick={openSearch}
        className="w-11 h-11 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer rounded-lg"
        aria-label="Open search"
      >
        <Search size={18} strokeWidth={1.75} />
      </button>
    </div>
  )
}

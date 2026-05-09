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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <span className="font-bold text-white text-sm">Allawee</span>

      <button
        onClick={openSearch}
        className="w-11 h-11 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer rounded-lg"
        aria-label="Open search"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    </div>
  )
}

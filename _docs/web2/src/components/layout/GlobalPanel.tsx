import { X } from 'lucide-react'
import { usePanelContext } from '@/context/PanelContext'

export function GlobalPanel() {
  const { panelState, closePanel } = usePanelContext()
  const isOpen = !!panelState.id

  return (
    <div
      className={[
        'flex-shrink-0 h-full overflow-hidden transition-[width] duration-300 ease-in-out',
        isOpen ? 'w-full md:w-95 lg:w-105' : 'w-0',
      ].join(' ')}
    >
      <div className="h-full w-screen md:w-95 lg:w-105 bg-surface-primary border-l border-border-primary-light flex flex-col overflow-hidden">
        <div className="flex items-center justify-end p-3 shrink-0">
          <button
            onClick={closePanel}
            className="p-1.5 text-content-tertiary hover:text-content-primary hover:bg-surface-secondary rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <p className="text-content-secondary text-sm">Detail panel — full implementation being ported.</p>
        </div>
      </div>
    </div>
  )
}

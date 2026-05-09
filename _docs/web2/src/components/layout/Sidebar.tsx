import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Wallet, ShieldAlert, Users,
  CreditCard, ArrowLeftRight, Code2, Settings,
  ChevronDown, X,
} from 'lucide-react'
import { avatarColor } from '@/lib/avatar'
import { useMode } from '@/context/ModeContext'
import { useSidebar } from '@/context/SidebarContext'
import { useAuth } from '@/context/AuthContext'

type NavIcon = React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
type ChildItem = { href: string; label: string }
type ParentConfig = {
  kind: 'parent'
  id: string
  label: string
  icon: NavIcon
  basePath: string
  children: ChildItem[]
}
type LinkConfig = {
  kind: 'link'
  id: string
  label: string
  icon: NavIcon
  href: string
  end?: boolean
}
type SectionItem = ParentConfig | LinkConfig

const NAV_STANDALONE = [
  { href: '/dashboard', label: 'Dashboard', end: true, icon: LayoutDashboard },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/accounts', label: 'Accounts', icon: Wallet },
  { href: '/dashboard/disputes', label: 'Disputes', icon: ShieldAlert },
]

const NAV_SECTIONS: { section: string; items: SectionItem[] }[] = [
  {
    section: 'PRODUCTS',
    items: [
      {
        kind: 'parent',
        id: 'issuing',
        label: 'Issuing',
        icon: CreditCard,
        basePath: '/dashboard/issuing',
        children: [
          { href: '/dashboard/issuing/card-programs', label: 'Card programs' },
          { href: '/dashboard/issuing/cards', label: 'Cards' },
          { href: '/dashboard/issuing/authorizations', label: 'Authorizations' },
          { href: '/dashboard/issuing/bins', label: 'BINs' },
          { href: '/dashboard/issuing/transactions', label: 'Transactions' },
        ],
      },
      {
        kind: 'link',
        id: 'payments',
        label: 'Payments',
        icon: ArrowLeftRight,
        href: '/dashboard/payments',
      },
    ],
  },
  {
    section: 'ADMIN',
    items: [
      {
        kind: 'parent',
        id: 'developer',
        label: 'Developer',
        icon: Code2,
        basePath: '/dashboard/developer',
        children: [
          { href: '/dashboard/developer/webhooks', label: 'Webhooks' },
          { href: '/dashboard/developer/events', label: 'Events' },
          { href: '/dashboard/developer/api-keys', label: 'API keys' },
          { href: '/dashboard/developer/logs', label: 'Logs' },
        ],
      },
      {
        kind: 'parent',
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        basePath: '/dashboard/settings',
        children: [
          { href: '/dashboard/settings/profile', label: 'Profile' },
          { href: '/dashboard/settings/compliance', label: 'Compliance' },
          { href: '/dashboard/settings/billing', label: 'Billing' },
          { href: '/dashboard/settings/team', label: 'Team' },
          { href: '/dashboard/settings/security', label: 'Security' },
        ],
      },
    ],
  },
]

function StandaloneItem({
  href, label, end, icon: Icon, tabletExpanded,
}: {
  href: string; label: string; end?: boolean; icon: NavIcon; tabletExpanded: boolean
}) {
  const location = useLocation()
  const isActive = end ? location.pathname === href : location.pathname.startsWith(href)
  const labelClass = tabletExpanded ? 'block' : 'block md:hidden lg:block'

  return (
    <li>
      <Link
        to={href}
        title={label}
        className={[
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
          tabletExpanded ? '' : 'md:justify-center lg:justify-start',
          isActive
            ? 'bg-surface-secondary text-content-primary font-semibold'
            : 'text-content-tertiary hover:bg-surface-secondary/60 hover:text-content-secondary',
        ].join(' ')}
      >
        <Icon size={15} strokeWidth={1.75} className="shrink-0" />
        <span className={labelClass}>{label}</span>
      </Link>
    </li>
  )
}

function ChildItem({ href, label }: ChildItem) {
  const location = useLocation()
  const isActive = location.pathname === href || location.pathname.startsWith(href + '/')

  return (
    <li>
      <Link
        to={href}
        className={[
          'flex items-center pl-9 pr-3 py-[7px] rounded-lg text-sm font-medium transition-colors cursor-pointer',
          isActive
            ? 'bg-surface-secondary text-content-primary font-semibold'
            : 'text-content-tertiary hover:bg-surface-secondary/60 hover:text-content-secondary',
        ].join(' ')}
      >
        {label}
      </Link>
    </li>
  )
}

function ParentItem({
  config, isOpen, onToggle, tabletExpanded,
}: {
  config: ParentConfig; isOpen: boolean; onToggle: () => void; tabletExpanded: boolean
}) {
  const location = useLocation()
  const hasActiveChild = location.pathname.startsWith(config.basePath)
  const Icon = config.icon
  const labelClass = tabletExpanded ? 'flex-1 text-left' : 'flex-1 text-left md:hidden lg:flex'
  const chevronClass = tabletExpanded ? 'block' : 'block md:hidden lg:block'

  return (
    <li>
      <button
        onClick={onToggle}
        title={config.label}
        aria-expanded={isOpen}
        className={[
          'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer',
          tabletExpanded ? '' : 'md:justify-center lg:justify-start',
          isOpen || hasActiveChild
            ? 'text-content-primary'
            : 'text-content-tertiary hover:bg-surface-secondary/60 hover:text-content-secondary',
        ].join(' ')}
      >
        <Icon size={15} strokeWidth={1.75} className="shrink-0" />
        <span className={labelClass}>{config.label}</span>
        <ChevronDown
          size={13}
          strokeWidth={2}
          className={[
            'shrink-0 transition-transform duration-200',
            chevronClass,
            isOpen ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>

      {isOpen && (
        <ul
          className={[
            'mt-0.5 space-y-0.5',
            tabletExpanded ? '' : 'md:hidden lg:block',
          ].join(' ')}
        >
          {config.children.map(child => (
            <ChildItem key={child.href} {...child} />
          ))}
        </ul>
      )}
    </li>
  )
}

export function Sidebar() {
  const { isMobileOpen, isTabletExpanded, closeMobileSidebar, toggleTabletExpanded } = useSidebar()
  const { user, business, logout } = useAuth()
  const { isSandboxMode } = useMode()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [openParent, setOpenParent] = useState<string | null>(null)

  const navSections = NAV_SECTIONS.map(section => {
    if (section.section !== 'ADMIN') return section
    return {
      ...section,
      items: section.items.map(item => {
        if (item.kind !== 'parent' || item.id !== 'settings') return item
        return {
          ...item,
          children: item.children.filter(child =>
            child.href === '/dashboard/settings/billing' ? !isSandboxMode : true
          ),
        }
      }),
    }
  })

  function showOnMobileAndDesktop(displayVal = 'block') {
    return isTabletExpanded ? displayVal : `${displayVal} md:hidden lg:${displayVal}`
  }

  function showOnTabletOnly(displayVal = 'flex') {
    return isTabletExpanded ? 'hidden' : `hidden md:${displayVal} lg:hidden`
  }

  function handleParentToggle(parentId: string) {
    setOpenParent(prev => prev === parentId ? null : parentId)
  }

  return (
    <aside
      className={[
        'absolute top-0 left-0 h-full bg-[#0a0a0b] border-r border-white/5 flex flex-col z-30',
        'w-70',
        isTabletExpanded ? 'md:w-56' : 'md:w-14',
        'lg:w-56',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        'transition-[transform,width] duration-220 ease-out',
        'overflow-hidden',
      ].join(' ')}
    >
      {/* Mobile close */}
      <div className="md:hidden flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
        <span className="text-xs font-medium text-white/40">Navigation</span>
        <button
          onClick={closeMobileSidebar}
          className="w-11 h-11 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer rounded-lg"
          aria-label="Close navigation"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>

      {/* Logo */}
      <div className="px-5 pt-6 pb-8 flex items-center justify-between gap-2 shrink-0">
        <img
          src="/logo.svg"
          alt="Paystack Issuing"
          className={`h-6 w-auto shrink-0 ${showOnMobileAndDesktop()}`}
        />
        <div
          className={`w-7 h-7 rounded-lg bg-action-primary-main items-center justify-center text-white text-xs font-bold shrink-0 ${showOnTabletOnly()}`}
          aria-hidden="true"
        >
          {business?.name?.substring(0, 1) || 'G'}
        </div>
      </div>

      {/* Nav */}
      <nav aria-label="Main navigation" className="flex-1 px-3 overflow-y-auto">
        <ul className="space-y-0.5 mb-6">
          {NAV_STANDALONE.map(item => (
            <StandaloneItem key={item.href} {...item} tabletExpanded={isTabletExpanded} />
          ))}
        </ul>

        {navSections.map(section => (
          <div key={section.section} className="mb-6">
            <p className="px-3 mb-2 text-[11px] font-medium text-white/25 tracking-wider">
              {section.section}
            </p>
            <ul className="space-y-0.5">
              {section.items.map(item =>
                item.kind === 'parent' ? (
                  <ParentItem
                    key={item.id}
                    config={item}
                    isOpen={openParent === item.id}
                    onToggle={() => handleParentToggle(item.id)}
                    tabletExpanded={isTabletExpanded}
                  />
                ) : (
                  <StandaloneItem
                    key={item.id}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    tabletExpanded={isTabletExpanded}
                  />
                )
              )}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}

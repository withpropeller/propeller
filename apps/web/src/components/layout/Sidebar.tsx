'use client'

import React, { useState } from 'react'
import Link from '@/lib/routing'
import { usePathname } from '@/lib/routing'
import {
  LayoutDashboard, Users, Wallet, ShieldAlert, ArrowLeftRight,
  Code2, Settings, ChevronDown, ChevronLeft, ChevronRight, X,
  LogOut, MoreVertical,
} from 'lucide-react'
import { Button } from '@/lib/pax'
import { avatarColor } from '@/lib/avatar'
import { useMode } from '@/context/ModeContext'
import { useSidebar } from '@/context/SidebarContext'
import { useAuth } from '@/context/AuthContext'

// ─── Nav config ──────────────────────────────────────────────────────────────

const NAV_STANDALONE = [
  { href: '/dashboard', label: 'Dashboard', end: true, icon: LayoutDashboard },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/accounts', label: 'Accounts', icon: Wallet },
  { href: '/dashboard/disputes', label: 'Disputes', icon: ShieldAlert },
]

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

const NAV_SECTIONS: { section: string; items: SectionItem[] }[] = [
  {
    section: 'PRODUCTS',
    items: [
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function StandaloneItem({
  href, label, end, icon: Icon, tabletExpanded,
}: {
  href: string; label: string; end?: boolean; icon: NavIcon; tabletExpanded: boolean
}) {
  const pathname = usePathname()
  const isActive = end ? pathname === href : pathname.startsWith(href)
  const labelClass = tabletExpanded ? 'block' : 'block md:hidden lg:block'

  return (
    <li>
      <Link
        href={href}
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
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <li>
      <Link
        href={href}
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
  const pathname = usePathname()
  const hasActiveChild = pathname.startsWith(config.basePath)
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

// ─── Sidebar ─────────────────────────────────────────────────────────────────

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
        'absolute top-0 left-0 h-full bg-(--midnight-100) border-r border-border-primary-light flex flex-col z-30',
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
        <span className="text-xs font-medium text-content-tertiary">Navigation</span>
        <button
          onClick={closeMobileSidebar}
          className="w-11 h-11 flex items-center justify-center text-content-tertiary hover:text-content-primary transition-colors cursor-pointer rounded-lg"
          aria-label="Close navigation"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>

      {/* Logo */}
      <div className="px-5 pt-6 pb-8 flex items-center justify-between gap-2 shrink-0">
        <img
          src="/hyphen-logo-dark.svg"
          alt="Hyphen"
          className={`h-6 w-auto shrink-0 ${showOnMobileAndDesktop()}`}
        />
        <img
          src="/hyphen-icon.svg"
          alt="Hyphen"
          className={`size-7 shrink-0 ${showOnTabletOnly()}`}
        />
      </div>

      {/* Nav */}
      <nav aria-label="Main navigation" className="flex-1 px-3 overflow-y-auto scrollbar-thin">
        {/* Standalone top-level items */}
        <ul className="space-y-0.5 mb-6">
          {NAV_STANDALONE.map(item => (
            <StandaloneItem key={item.href} {...item} tabletExpanded={isTabletExpanded} />
          ))}
        </ul>

        {/* Expandable sections */}
        {navSections.map(({ section, items }) => (
          <div key={section} className="mb-6">
            {/* Section header */}
            <div
              className={`px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-content-tertiary ${showOnMobileAndDesktop()}`}
            >
              {section}
            </div>
            {/* Tablet collapsed divider */}
            <div
              className={`mx-2 mb-2 h-px bg-border-primary-light ${showOnTabletOnly('block')}`}
              aria-hidden="true"
            />
            <ul className="space-y-0.5">
              {items.map(item => (
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
                    end={item.end}
                    icon={item.icon}
                    tabletExpanded={isTabletExpanded}
                  />
                )
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Tablet expand/collapse toggle */}
      <button
        onClick={toggleTabletExpanded}
        className="hidden md:flex lg:hidden h-11 shrink-0 border-t border-border-primary-light items-center justify-center text-content-tertiary hover:text-content-primary transition-colors cursor-pointer w-full"
        aria-label={isTabletExpanded ? 'Collapse navigation' : 'Expand navigation'}
      >
        {isTabletExpanded
          ? <ChevronLeft size={16} strokeWidth={1.75} />
          : <ChevronRight size={16} strokeWidth={1.75} />
        }
      </button>

      {/* User section */}
      <div className="px-4 py-4 border-t border-border-primary-light shrink-0 relative">
        {showUserMenu && (
          <div className={`absolute bottom-full left-4 right-4 mb-2 bg-surface-primary border border-border-primary-light rounded-xl shadow-elevate3 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-50 ${showOnMobileAndDesktop()}`}>
            <div className="px-4 py-3 border-b border-border-primary-light bg-surface-secondary/30">
              <p className="text-xs font-semibold text-content-primary">Signed in as</p>
              <p className="text-xs text-content-tertiary truncate">{user?.email}</p>
            </div>
            <div className="p-1.5">
              <Button
                variant="ghost"
                color="danger"
                size="sm"
                onClick={() => { setShowUserMenu(false); logout() }}
                className="w-full justify-start gap-2.5 px-3"
              >
                <LogOut size={14} strokeWidth={1.75} />
                Log out
              </Button>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all group hover:bg-surface-secondary cursor-pointer ${showUserMenu ? 'bg-surface-secondary' : ''}`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 group-hover:scale-105 transition-transform ${avatarColor((user as any)?.id || user?.email || '')}`}>
            {(user as any)?.firstName?.substring(0, 1)}{(user as any)?.lastName?.substring(0, 1)}
          </div>
          <div className={`flex-1 min-w-0 text-left ${showOnMobileAndDesktop()}`}>
            <div className="text-sm font-medium text-content-primary truncate">
              {business?.name || (user as any)?.firstName}
            </div>
            <div className="text-[10px] text-content-tertiary truncate">
              {user?.email}
            </div>
          </div>
          <div className={showOnMobileAndDesktop()}>
            <MoreVertical size={14} className="text-content-tertiary group-hover:text-content-secondary transition-colors" />
          </div>
        </button>
      </div>
    </aside>
  )
}

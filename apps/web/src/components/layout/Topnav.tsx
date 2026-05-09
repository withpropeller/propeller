'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import {
  IconButton,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/lib/pax'
import { useIssuingNav } from '@/context/IssuingNavContext'
import { useMode } from '@/context/ModeContext'
import { useProfileControllerUpdateProfile } from '@/api/me/me'
import { useBusinessControllerFind } from '@/api/business/business'

// Single-level breadcrumb pages — just show the label, no back button
const LIST_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/issuing': 'Issuing',
  '/dashboard/payments': 'Payments',
  '/dashboard/accounts': 'Accounts',
  '/dashboard/customers': 'Customers',
  '/dashboard/disputes': 'Disputes',
}

// Two-level breadcrumb pages — section > subsection, no back button
interface SectionInfo {
  section: string
  sectionPath: string
  subsection: string
}

const SECTION_LABELS: Record<string, SectionInfo> = {
  '/dashboard/issuing/card-programs':   { section: 'Issuing',    sectionPath: '/dashboard/issuing',    subsection: 'Card programs' },
  '/dashboard/issuing/cards':           { section: 'Issuing',    sectionPath: '/dashboard/issuing',    subsection: 'Cards' },
  '/dashboard/issuing/authorizations':  { section: 'Issuing',    sectionPath: '/dashboard/issuing',    subsection: 'Authorizations' },
  '/dashboard/issuing/bins':            { section: 'Issuing',    sectionPath: '/dashboard/issuing',    subsection: 'BINs' },
  '/dashboard/issuing/transactions':    { section: 'Issuing',    sectionPath: '/dashboard/issuing',    subsection: 'Transactions' },
  '/dashboard/developer/webhooks':      { section: 'Developer',  sectionPath: '/dashboard/developer',  subsection: 'Webhooks' },
  '/dashboard/developer/events':        { section: 'Developer',  sectionPath: '/dashboard/developer',  subsection: 'Events' },
  '/dashboard/developer/api-keys':      { section: 'Developer',  sectionPath: '/dashboard/developer',  subsection: 'API keys' },
  '/dashboard/developer/logs':          { section: 'Developer',  sectionPath: '/dashboard/developer',  subsection: 'Logs' },
  '/dashboard/settings/profile':        { section: 'Settings',   sectionPath: '/dashboard/settings',   subsection: 'Profile' },
  '/dashboard/settings/business':       { section: 'Settings',   sectionPath: '/dashboard/settings',   subsection: 'Business identity' },
  '/dashboard/settings/compliance':     { section: 'Settings',   sectionPath: '/dashboard/settings',   subsection: 'Compliance' },
  '/dashboard/settings/team':           { section: 'Settings',   sectionPath: '/dashboard/settings',   subsection: 'Team' },
  '/dashboard/settings/security':       { section: 'Settings',   sectionPath: '/dashboard/settings',   subsection: 'Security' },
  '/dashboard/settings/billing':        { section: 'Settings',   sectionPath: '/dashboard/settings',   subsection: 'Billing' },
}

// Ancestor info for detail pages — keyed by path segments before the dynamic ID
interface ParentInfo {
  section: string
  sectionPath: string
  subsection?: string
  subsectionPath?: string
}

const DETAIL_PARENTS: Record<string, ParentInfo> = {
  'accounts':               { section: 'Accounts',  sectionPath: '/dashboard/accounts' },
  'customers':              { section: 'Customers', sectionPath: '/dashboard/customers' },
  'disputes':               { section: 'Disputes',  sectionPath: '/dashboard/disputes' },
  // Legacy top-level api-keys route
  'api-keys':               { section: 'Developer', sectionPath: '/dashboard/developer', subsection: 'API keys', subsectionPath: '/dashboard/developer/api-keys' },
  'issuing/card-programs':  { section: 'Issuing',   sectionPath: '/dashboard/issuing',   subsection: 'Card programs',   subsectionPath: '/dashboard/issuing/card-programs' },
  'issuing/cards':          { section: 'Issuing',   sectionPath: '/dashboard/issuing',   subsection: 'Cards',           subsectionPath: '/dashboard/issuing/cards' },
  'issuing/authorizations': { section: 'Issuing',   sectionPath: '/dashboard/issuing',   subsection: 'Authorizations',  subsectionPath: '/dashboard/issuing/authorizations' },
  'issuing/bins':           { section: 'Issuing',   sectionPath: '/dashboard/issuing',   subsection: 'BINs',            subsectionPath: '/dashboard/issuing/bins' },
  'issuing/transactions':   { section: 'Issuing',   sectionPath: '/dashboard/issuing',   subsection: 'Transactions',    subsectionPath: '/dashboard/issuing/transactions' },
  'developer/events':       { section: 'Developer', sectionPath: '/dashboard/developer', subsection: 'Events',          subsectionPath: '/dashboard/developer/events' },
  'developer/webhooks':     { section: 'Developer', sectionPath: '/dashboard/developer', subsection: 'Webhooks',        subsectionPath: '/dashboard/developer/webhooks' },
  'developer/api-keys':     { section: 'Developer', sectionPath: '/dashboard/developer', subsection: 'API keys',        subsectionPath: '/dashboard/developer/api-keys' },
  'settings/billing':       { section: 'Settings',  sectionPath: '/dashboard/settings',  subsection: 'Billing',         subsectionPath: '/dashboard/settings/billing' },
}

function getDetailParent(segments: string[]): ParentInfo | null {
  if (segments.length === 0) return null
  if (segments.length >= 2) {
    const key = `${segments[0]}/${segments[1]}`
    if (DETAIL_PARENTS[key]) return DETAIL_PARENTS[key]
  }
  return DETAIL_PARENTS[segments[0]] ?? null
}

function ModeBadge() {
  const { isSandboxMode, setMode } = useMode()
  const updateProfile = useProfileControllerUpdateProfile()
  const { data: bizData } = useBusinessControllerFind()

  const isApproved = (bizData as any)?.data?.status === 'approved'
  console.log('Business status:', (bizData as any)?.data?.data?.status)
  const canGoLive = !isSandboxMode || isApproved

  function handleToggle() {
    if (isSandboxMode && !isApproved) return
    const newMode = isSandboxMode ? 'live' : 'sandbox'
    updateProfile.mutate({ data: { preferences: { dashboardMode: newMode } } })
    setMode(newMode)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isSandboxMode && !isApproved}
      title={isSandboxMode && !isApproved ? 'Your business must be approved to switch to live mode' : undefined}
      aria-label={`Switch to ${isSandboxMode ? 'live' : 'sandbox'} mode`}
      aria-pressed={isSandboxMode}
      className={[
        'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border transition-colors shrink-0',
        canGoLive ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
        isSandboxMode
          ? 'border-feedback-warning-border bg-feedback-warning-light text-feedback-warning-dark'
          : 'border-border-primary-light bg-surface-secondary text-content-secondary hover:bg-surface-tertiary',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'w-1.5 h-1.5 rounded-full shrink-0',
          isSandboxMode ? 'bg-feedback-warning-main' : 'bg-feedback-success-main',
        ].join(' ')}
      />
      {isSandboxMode ? 'Sandbox' : 'Live'}
    </button>
  )
}

export function Topnav() {
  const pathname = usePathname()
  const router = useRouter()
  const { pageTitle } = useIssuingNav()

  const listLabel = LIST_LABELS[pathname]
  const isListPage = listLabel !== undefined

  const sectionInfo = SECTION_LABELS[pathname]
  const isSectionPage = !!sectionInfo

  const segments = pathname.replace(/^\/dashboard\/?/, '').split('/').filter(Boolean)
  const parent = !isListPage && !isSectionPage ? getDetailParent(segments) : null

  const isDetailPage = !isListPage && !isSectionPage

  return (
    <div className="bg-surface-primary border-b border-border-primary-light">
      <div className="px-4 md:px-8 h-14 flex items-center justify-between gap-4">

        {/* Leading: back button + breadcrumb */}
        <div className="flex items-center gap-1 min-w-0">
          {isDetailPage && (
            <IconButton
              variant="ghost"
              color="secondary"
              size="sm"
              onClick={() => router.back()}
              aria-label="Go back"
            >
              <ArrowLeft width={16} height={16} />
            </IconButton>
          )}

          <Breadcrumb>
            <BreadcrumbList>
              {isListPage ? (
                <BreadcrumbItem>
                  <BreadcrumbPage>{listLabel}</BreadcrumbPage>
                </BreadcrumbItem>

              ) : isSectionPage ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={sectionInfo.sectionPath}>{sectionInfo.section}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{sectionInfo.subsection}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>

              ) : parent ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={parent.sectionPath}>{parent.section}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>

                  {parent.subsection && parent.subsectionPath && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        {pageTitle ? (
                          <BreadcrumbLink asChild>
                            <Link href={parent.subsectionPath}>{parent.subsection}</Link>
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage>{parent.subsection}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                    </>
                  )}

                  {pageTitle && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage className="truncate max-w-48">
                          {pageTitle}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </>

              ) : null}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Trailing: mode toggle */}
        <ModeBadge />
      </div>
    </div>
  )
}

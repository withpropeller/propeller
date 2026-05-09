import { Link, useLocation } from 'react-router-dom'
import { useIssuingNav } from '@/context/IssuingNavContext'
import { useMode } from '@/context/ModeContext'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/lib/pax'

const LIST_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/issuing': 'Issuing',
  '/dashboard/payments': 'Payments',
  '/dashboard/accounts': 'Accounts',
  '/dashboard/customers': 'Customers',
  '/dashboard/disputes': 'Disputes',
}

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

export function Topnav() {
  const location = useLocation()
  const pathname = location.pathname
  const { pageTitle } = useIssuingNav()

  // Check single-level labels
  const singleLabel = LIST_LABELS[pathname]
  if (singleLabel) {
    return (
      <div className="h-12 flex items-center px-4 md:px-6 border-b border-border-primary-light bg-surface-primary">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{singleLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    )
  }

  // Check two-level section labels
  const sectionInfo = SECTION_LABELS[pathname]
  if (sectionInfo) {
    return (
      <div className="h-12 flex items-center px-4 md:px-6 border-b border-border-primary-light bg-surface-primary">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={sectionInfo.sectionPath}>{sectionInfo.section}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{sectionInfo.subsection}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    )
  }

  // Fallback for dynamic/detail pages
  return (
    <div className="h-12 flex items-center px-4 md:px-6 border-b border-border-primary-light bg-surface-primary">
      <span className="text-sm text-content-secondary">
        {pageTitle ?? 'Detail'}
      </span>
    </div>
  )
}

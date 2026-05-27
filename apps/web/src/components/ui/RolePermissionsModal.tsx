'use client'

import {
  ModalDialog,
  ModalDialogContent,
  ModalDialogHeader,
  ModalDialogTitle,
  ModalDialogDescription,
} from '@/lib/pax'

type Access = 'yes' | 'no'

interface PermissionRow {
  page: string
  admin: Access
  developer: Access
}

// Placeholder matrix — mirrors the Sidebar's top-level pages. Intended to be
// replaced with the real role → page mapping once the business defines it.
const PERMISSIONS: PermissionRow[] = [
  { page: 'Dashboard',         admin: 'yes', developer: 'yes' },
  { page: 'Customers',         admin: 'yes', developer: 'yes' },
  { page: 'Accounts',          admin: 'yes', developer: 'yes' },
  { page: 'Disputes',          admin: 'yes', developer: 'yes' },
  { page: 'Payments',          admin: 'yes', developer: 'yes' },
  { page: 'Developer tools',   admin: 'yes', developer: 'yes' },
  { page: 'Business Identity', admin: 'yes', developer: 'no'  },
  { page: 'Team',              admin: 'yes', developer: 'no'  },
  { page: 'Security',          admin: 'yes', developer: 'yes' },
]

function AccessMark({ access }: { access: Access }) {
  return access === 'yes' ? (
    <span className="text-feedback-success-main font-medium" aria-label="Allowed">✓</span>
  ) : (
    <span className="text-content-quaternary" aria-label="Not allowed">✗</span>
  )
}

interface Props {
  onClose: () => void
}

export function RolePermissionsModal({ onClose }: Props) {
  return (
    <ModalDialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <ModalDialogContent className="max-w-lg !p-0 !gap-0 overflow-hidden rounded-2xl">
        <ModalDialogHeader className="px-6 pt-5 pb-4 border-b border-border-primary-light">
          <ModalDialogTitle>Role permissions</ModalDialogTitle>
          <ModalDialogDescription>
            What each role can access in this dashboard.
          </ModalDialogDescription>
        </ModalDialogHeader>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-secondary border-b border-border-primary-light">
                <th className="px-5 py-3 text-left text-xs font-medium text-content-tertiary">Page</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-content-tertiary w-24">Admin</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-content-tertiary w-24">Developer</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((row, i) => (
                <tr
                  key={row.page}
                  className={[
                    'border-b border-border-primary-light last:border-0',
                    i % 2 === 0 ? 'bg-surface-primary' : 'bg-surface-secondary',
                  ].join(' ')}
                >
                  <td className="px-5 py-2.5 text-content-secondary font-medium">{row.page}</td>
                  <td className="px-4 py-2.5 text-center"><AccessMark access={row.admin} /></td>
                  <td className="px-4 py-2.5 text-center"><AccessMark access={row.developer} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer note */}
        <div className="px-5 py-3 border-t border-border-primary-light">
          <p className="text-xs text-content-tertiary">
            Role permissions are set by Propeller. Contact support to discuss custom access levels.
          </p>
        </div>
      </ModalDialogContent>
    </ModalDialog>
  )
}

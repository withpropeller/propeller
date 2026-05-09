import { createContext, useContext, type ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useProfileControllerGet } from '@/api/me/me'
import { hasPermission, type ExpandedRole } from '@/lib/permissions'

interface PermissionsContextType {
  can: (permission: string) => boolean
  roles: ExpandedRole[]
  isLoading: boolean
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

const ME_PARAMS = { expand: ['roles'] }

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authIsLoading } = useAuth()

  const { data, isLoading: queryIsLoading } = useProfileControllerGet(ME_PARAMS, {
    query: { enabled: isAuthenticated },
  })

  const roles: ExpandedRole[] = (() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = data as any
    if (!raw) return []
    const user = raw?.data ?? {}

    // Case 1: roles were expanded into full objects with a permissions array
    const rawRoles = user?.roles ?? []
    if (Array.isArray(rawRoles) && rawRoles.length > 0 && typeof rawRoles[0] === 'object') {
      return rawRoles as ExpandedRole[]
    }

    // Case 2: flat permissions array returned directly on the user object
    const flatPerms: string[] = Array.isArray(user?.permissions) ? user.permissions : []
    if (flatPerms.length > 0) {
      return [{ id: '', name: 'default', slug: 'default', type: 'default', permissions: flatPerms, createdAt: '', updatedAt: '' }]
    }

    return []
  })()

  // Stay in loading state until auth resolves AND (if authenticated) until the query settles
  const isLoading = authIsLoading || (isAuthenticated && queryIsLoading)

  return (
    <PermissionsContext.Provider
      value={{
        can: (permission) => hasPermission(roles, permission),
        roles,
        isLoading,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissionsContext() {
  const ctx = useContext(PermissionsContext)
  if (!ctx) throw new Error('usePermissionsContext must be used within PermissionsProvider')
  return ctx
}

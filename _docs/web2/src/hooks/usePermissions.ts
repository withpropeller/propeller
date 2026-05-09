import { usePermissionsContext } from '@/context/PermissionsContext'

export function usePermissions() {
  const ctx = usePermissionsContext()

  function hasRole(slug: string): boolean {
    return ctx.roles.some((r) => r.slug === slug)
  }

  return { ...ctx, hasRole }
}

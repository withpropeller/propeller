import { useQuery } from '@tanstack/react-query'
import { customInstance } from '@/lib/orvalClient'

// Stub — replace with Orval-generated code after running `npm run generate`

export function useProfileControllerGet(
  params?: { expand?: string[] },
  options?: { query?: { enabled?: boolean } },
) {
  return useQuery({
    queryKey: ['me', params],
    queryFn: () => customInstance<any>('/me'),
    enabled: options?.query?.enabled ?? true,
    staleTime: 60 * 1000,
  })
}

export function useProfileControllerUpdateProfile() {
  // Stub — implement when Orval generates this hook
  return { mutate: () => {}, mutateAsync: async () => ({}), ...({} as any) }
}

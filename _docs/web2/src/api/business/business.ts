import { useQuery } from '@tanstack/react-query'
import { customInstance } from '@/lib/orvalClient'

// Stub — replace with Orval-generated code after running `npm run generate`

export function useBusinessControllerFind() {
  return useQuery({
    queryKey: ['business'],
    queryFn: () => customInstance<any>('/business'),
    staleTime: 5 * 60 * 1000,
  })
}

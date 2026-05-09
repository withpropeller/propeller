import { useMutation } from '@tanstack/react-query'
import { customInstance } from '@/lib/orvalClient'

// Stub — replace with Orval-generated code after running `npm run generate`

export function useAuthControllerCreate() {
  return useMutation({
    mutationFn: (body: { data: Record<string, unknown> }) =>
      customInstance<any>('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body.data),
      }),
  } as any)
}

export function useAuthControllerSendConfirmation() {
  return useMutation({
    mutationFn: (body: { data: { email: string } }) =>
      customInstance<any>('/auth/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body.data),
      }),
  } as any)
}

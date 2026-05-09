import {
  useAuthControllerCreate,
  useAuthControllerSendConfirmation
} from '@/api/auth/auth'
import type { ActivateAccountDto } from '@/api/model'
import { useMutation } from '@tanstack/react-query'
import { customInstance } from '@/lib/orvalClient'

interface SignupFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  businessName: string
  businessWebsite: string
  businessRegStatus: string
  termsAccepted: boolean
}

export function useSignup() {
  const { mutate: orvalMutate, mutateAsync: orvalMutateAsync, ...rest } = useAuthControllerCreate()

  const mutate = (
    formData: SignupFormData,
    options?: Parameters<typeof orvalMutate>[1]
  ) => {
    const { businessRegStatus, termsAccepted, ...fields } = formData
    orvalMutate(
      {
        data: {
          ...fields,
          isIncorporated: businessRegStatus !== 'UNREGISTERED',
          countryCode: 'NG',
        },
      },
      options
    )
  }

  const mutateAsync = async (
    formData: SignupFormData,
    options?: Parameters<typeof orvalMutateAsync>[1]
  ) => {
    const { businessRegStatus, termsAccepted, ...fields } = formData
    return orvalMutateAsync(
      {
        data: {
          ...fields,
          isIncorporated: businessRegStatus !== 'UNREGISTERED',
          countryCode: 'NG',
        },
      },
      options
    )
  }

  return { ...rest, mutate, mutateAsync }
}

export function useResendConfirmation() {
  const { mutate: orvalMutate, mutateAsync: orvalMutateAsync, ...rest } =
    useAuthControllerSendConfirmation()

  const mutate = (
    payload: { email: string },
    options?: Parameters<typeof orvalMutate>[1]
  ) => {
    orvalMutate({ data: { email: payload.email } }, options)
  }

  const mutateAsync = async (
    payload: { email: string },
    options?: Parameters<typeof orvalMutateAsync>[1]
  ) => {
    return orvalMutateAsync({ data: { email: payload.email } }, options)
  }

  return { ...rest, mutate, mutateAsync }
}

export function useGetInvitation(stateToken: string) {
  return useMutation({
    mutationFn: async () => {
      return customInstance<unknown>(`/auth/account/info?stateToken=${stateToken}`, {
        method: 'GET',
      })
    },
  })
}

interface AcceptInvitePayload {
  firstName: string
  lastName: string
  password: string
  businessId: string
  stateToken: string
}

export function useAcceptInvite() {
  return useMutation({
    mutationFn: async ({ stateToken, ...payload }: AcceptInvitePayload) => {
      return customInstance<unknown>(`/auth/account/activate?stateToken=${stateToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    },
  })
}

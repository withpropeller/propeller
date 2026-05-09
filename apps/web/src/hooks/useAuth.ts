import { useMutation } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import { useAuth } from '../context/AuthContext'
import { API_STATUS } from '../lib/constants'

interface LoginRequest {
  email: string
  password: string
}

interface MfaVerifyRequest {
  email: string
  password: string
  token: string
  mfaChannel: string
}

interface SendMfaRequest {
  stateToken: string
  channel: string
}

interface ApiResponse<T = unknown> {
  code: string
  message?: string
  data?: T
}

interface AuthData {
  accessToken?: string
  user?: {
    id: string
    email: string
    name: string
  }
  business?: {
    id: string
    name: string
  }
}

/**
 * useLogin - Mutation hook for the initial login step (email/password).
 * Handles the logic of deciding whether to proceed to MFA or finish login.
 */
export function useLogin() {
  const { initializeAuth } = useAuth()

  return useMutation({
    mutationFn: async ({ email, password }: LoginRequest) => {
      return await apiClient.post<ApiResponse<AuthData>>('/auth', { email, password })
    },
    onSuccess: (res) => {
      if (res.code === API_STATUS.SUCCESS && res.data) {
        initializeAuth(res.data)
      }
    },
  })
}

/**
 * useMfaVerify - Mutation hook for the MFA verification step.
 */
export function useMfaVerify() {
  const { initializeAuth } = useAuth()

  return useMutation({
    mutationFn: async ({ email, password, token, mfaChannel }: MfaVerifyRequest) => {
      return await apiClient.post<ApiResponse<AuthData>>('/auth', {
        email,
        password,
        token,
        mfaChannel,
      })
    },
    onSuccess: (res) => {
      if (res.code === API_STATUS.SUCCESS && res.data) {
        initializeAuth(res.data)
      }
    },
  })
}

/**
 * useSendMfa - Mutation hook for sending/resending MFA codes.
 */
export function useSendMfa() {
  return useMutation({
    mutationFn: async ({ stateToken, channel }: SendMfaRequest) => {
      return await apiClient.post<ApiResponse>(`/auth/mfa/send?stateToken=${stateToken}`, {
        channel,
      })
    },
  })
}

/**
 * useForgotPassword - Mutation hook for requesting a password reset email.
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      return await apiClient.post<ApiResponse>('/auth/password/forgot', { email })
    },
  })
}

/**
 * useResetPassword - Mutation hook for setting a new password using a reset token.
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ token, newPassword }: { token: string; newPassword: string }) => {
      return await apiClient.post<ApiResponse>(
        `/auth/password/reset?token=${encodeURIComponent(token)}`,
        { newPassword }
      )
    },
  })
}

/**
 * useUpdateProfile - Mutation hook for updating user profile/preferences.
 */
export function useUpdateProfile() {
  const { initializeAuth } = useAuth()

  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      return await apiClient.post<ApiResponse>('/me', payload)
    },
    onSuccess: (res) => {
      if (res.code === 'success' && res.data) {
        initializeAuth({ user: res.data as AuthData['user'] })
      }
    },
  })
}

import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { useAuth } from '@/context/AuthContext'
import { API_STATUS } from '@/lib/constants'

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

export function useSendMfa() {
  return useMutation({
    mutationFn: async ({ stateToken, channel }: SendMfaRequest) => {
      return await apiClient.post<ApiResponse>(`/auth/mfa/send?stateToken=${stateToken}`, {
        channel,
      })
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      return await apiClient.post<ApiResponse>('/auth/password/forgot', { email })
    },
  })
}

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

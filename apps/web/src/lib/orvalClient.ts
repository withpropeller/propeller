import { API_BASE_URL, API_STATUS, STORAGE_KEYS } from './constants'

export type ErrorType<_Error = unknown> = {
  status: number
  message: string
  code: string
  data?: unknown
  errors?: { property: string; error: string }[]
}

/**
 * Custom fetch mutator for Orval-generated clients.
 *
 * Orval calls: customInstance<T>(url: string, options?: RequestInit)
 *
 * This wrapper injects:
 *  - Bearer token from localStorage
 *  - x-dashboard-mode header
 *  - Fires auth:unauthorized event and throws on 401
 *  - Throws a structured error on non-OK responses
 */
export const customInstance = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const isBrowser = typeof window !== 'undefined'
  const token = isBrowser ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null
  const mode = isBrowser
    ? (localStorage.getItem(STORAGE_KEYS.DASHBOARD_MODE) ?? 'sandbox')
    : 'sandbox'

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-dashboard-mode': mode,
      ...(options?.headers as Record<string, string> | undefined),
    },
  })

  const json = await response.json()

  if (!response.ok) {
    const code = json.code ?? 'error'

    if (response.status === 401 && code !== API_STATUS.PENDING) {
      if (isBrowser) {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      }
    }

    throw {
      status: response.status,
      message: json.message ?? 'Something went wrong',
      code,
      data: json.data,
      errors: json.error,
    } as ErrorType
  }

  return json as T
}

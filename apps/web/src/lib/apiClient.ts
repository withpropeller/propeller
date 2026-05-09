import { customInstance } from './orvalClient'

/**
 * Simple API client wrapper for non-Orval endpoints (like auth).
 * Uses the same customInstance fetch wrapper for consistency.
 */
export const apiClient = {
  get: <T = unknown>(path: string, options?: RequestInit): Promise<T> => 
    customInstance<T>(path, { ...options, method: 'GET' }),
  
  post: <T = unknown>(path: string, data?: unknown, options?: RequestInit): Promise<T> => 
    customInstance<T>(path, { 
      ...options, 
      method: 'POST', 
      body: data !== undefined ? JSON.stringify(data) : undefined 
    }),
  
  put: <T = unknown>(path: string, data?: unknown, options?: RequestInit): Promise<T> => 
    customInstance<T>(path, { 
      ...options, 
      method: 'PUT', 
      body: data !== undefined ? JSON.stringify(data) : undefined 
    }),
  
  delete: <T = unknown>(path: string, options?: RequestInit): Promise<T> => 
    customInstance<T>(path, { ...options, method: 'DELETE' }),
}

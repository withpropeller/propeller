import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { STORAGE_KEYS } from '@/lib/constants'

interface User {
  id: string
  email: string
  name: string
  preferences?: {
    dashboardMode?: 'live' | 'test'
  }
}

interface Business {
  id: string
  name: string
}

interface AuthContextType {
  user: User | null
  business: Business | null
  isAuthenticated: boolean
  isLoading: boolean
  initializeAuth: (data: { accessToken?: string; user?: User; business?: Business }) => void
  setBusinessData: (data: Business) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const initializeAuth = useCallback((data: { accessToken?: string; user?: User; business?: Business }) => {
    if (data.accessToken) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken)
    }
    if (data.user) {
      setUser(data.user)
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user))
    }
    if (data.business) {
      setBusiness(data.business)
      localStorage.setItem(STORAGE_KEYS.BUSINESS_DATA, JSON.stringify(data.business))
    }
    // Always reset to sandbox on login so every session starts safe.
    localStorage.setItem(STORAGE_KEYS.DASHBOARD_MODE, 'sandbox')
  }, [])

  const setBusinessData = useCallback((data: Business) => {
    setBusiness(data)
    localStorage.setItem(STORAGE_KEYS.BUSINESS_DATA, JSON.stringify(data))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setBusiness(null)
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER_DATA)
    localStorage.removeItem(STORAGE_KEYS.BUSINESS_DATA)
    localStorage.removeItem(STORAGE_KEYS.MFA_SKIP)
    localStorage.removeItem(STORAGE_KEYS.DASHBOARD_MODE)
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA)
    const storedBusiness = localStorage.getItem(STORAGE_KEYS.BUSINESS_DATA)
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error('Failed to parse stored user', e)
      }
    }
    if (storedBusiness) {
      try {
        setBusiness(JSON.parse(storedBusiness))
      } catch (e) {
        console.error('Failed to parse stored business', e)
      }
    }
    
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      logout()
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [logout])

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        isAuthenticated: !!user,
        isLoading,
        initializeAuth,
        setBusinessData,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

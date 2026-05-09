import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

interface AuthGuardProps {
  children: React.ReactNode
}

/**
 * AuthGuard - Protects routes by redirecting unauthenticated users to /auth/login
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const returnTo = location.pathname !== '/auth/login' ? location.pathname : '/'
      navigate(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`)
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action-primary-main"></div>
      </div>
    )
  }

  return <>{children}</>
}

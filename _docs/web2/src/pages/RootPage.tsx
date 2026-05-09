import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

/**
 * Root landing page — redirects based on authentication status:
 * - Authenticated users → /dashboard
 * - Unauthenticated users → /auth/login
 */
export default function RootPage() {
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/auth/login', { replace: true })
      }
    }
  }, [user, isLoading, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-primary">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action-primary-main"></div>
    </div>
  )
}

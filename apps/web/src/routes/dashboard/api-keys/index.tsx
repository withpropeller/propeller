import { Navigate } from 'react-router-dom'

export default function ApiKeysRedirectPage() {
  return <Navigate to="/dashboard/developer/api-keys" replace />
}

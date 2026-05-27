import { Navigate, useParams } from 'react-router-dom'

export default function AccountDetail() {
  const { id = '' } = useParams<{ id: string }>()
  return <Navigate to={`/dashboard/accounts?id=${encodeURIComponent(id)}`} replace />
}

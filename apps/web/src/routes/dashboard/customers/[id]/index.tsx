import { Navigate, useParams } from 'react-router-dom'

export default function CustomerDetail() {
  const { id = '' } = useParams<{ id: string }>()
  return <Navigate to={`/dashboard/customers?id=${encodeURIComponent(id)}`} replace />
}

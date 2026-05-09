import { redirect } from 'next/navigation'

export default async function AccountDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/dashboard/accounts?id=${encodeURIComponent(id)}`)
}

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { Alert, Button, Input, Label, PasswordInput } from '@/components/propeller'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { useGetInvitation, useAcceptInvite } from '@/hooks/useSignup'
import { API_STATUS } from '@/lib/constants'

type InvitationDetails = {
  stateToken?: string
  user?: { email?: string; businessName?: string }
}

export default function InvitePage() {
  const params = useParams()
  const businessId = params?.businessId as string
  const inviteCode = params?.inviteCode as string

  const [done, setDone] = useState(false)
  const [invalidToken, setInvalidToken] = useState(false)
  const [invitationDetails, setInvitationDetails] = useState<InvitationDetails | null>(null)
  const [stateToken, setStateToken] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })

  const getInvitationMutation = useGetInvitation(inviteCode)
  const acceptInviteMutation = useAcceptInvite()

  useEffect(() => {
    if (!businessId || !inviteCode) {
      setInvalidToken(true)
      return
    }
    getInvitationMutation.mutate(undefined, {
      onSuccess: (res) => {
        const data = (res as { data?: InvitationDetails })?.data ?? (res as InvitationDetails)
        if (!data) {
          setInvalidToken(true)
          return
        }
        setInvitationDetails(data)
        setStateToken(data?.stateToken ?? '')
        setFormData((prev) => ({ ...prev, email: data?.user?.email ?? '' }))
      },
      onError: () => setInvalidToken(true),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, inviteCode])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    acceptInviteMutation.mutate(
      {
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        businessId,
        stateToken,
      },
      {
        onSuccess: (res) => {
          const code = (res as { code?: string })?.code
          if (code === API_STATUS.SUCCESS || !code) setDone(true)
        },
      },
    )
  }

  const isFormValid =
    formData.firstName.trim() && formData.lastName.trim() && formData.password.length >= 8

  const businessName = invitationDetails?.user?.businessName

  if (done) {
    return (
      <AuthShell altAction={null}>
        <div className="text-center">
          <div className="size-14 bg-[#EAF9EF] border border-[#ACEBC0] rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="text-[#17B04A]" size={26} />
          </div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-warm-light mb-3">
            Account ready
          </p>
          <h1 className="text-[28px] leading-[1.1] tracking-tight text-warm-text font-normal mb-4">
            You&rsquo;re all set
          </h1>
          <p className="text-[15px] text-warm-muted mb-8 leading-relaxed">
            Your account is active. Sign in to access{' '}
            <span className="font-medium text-warm-text">{businessName ?? 'your workspace'}</span>.
          </p>
          <Link href="/auth/login" className="block">
            <Button size="lg" className="w-full">
              Sign in
            </Button>
          </Link>
        </div>
      </AuthShell>
    )
  }

  if (invalidToken) {
    return (
      <AuthShell altAction={{ label: 'Sign in', href: '/auth/login' }}>
        <div className="mb-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-warm-light mb-3">
            Invite expired
          </p>
          <h1 className="text-[32px] leading-[1.1] tracking-tight text-warm-text font-normal mb-3">
            This invite isn&rsquo;t valid anymore
          </h1>
          <p className="text-[15px] text-warm-muted leading-relaxed">
            Ask the admin who invited you to resend it.
          </p>
        </div>
        <Link href="/auth/login" className="block">
          <Button size="lg" className="w-full">
            Back to sign in
          </Button>
        </Link>
      </AuthShell>
    )
  }

  if (getInvitationMutation.isPending || !invitationDetails) {
    return (
      <AuthShell altAction={null}>
        <p className="text-center text-sm text-warm-muted">Loading invitation…</p>
      </AuthShell>
    )
  }

  return (
    <AuthShell altAction={{ label: 'Sign in', href: '/auth/login' }}>
      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-warm-light mb-3">
          You&rsquo;ve been invited
        </p>
        <h1 className="text-[32px] leading-[1.1] tracking-tight text-warm-text font-normal mb-3">
          {businessName ? (
            <>
              Join{' '}
              <span className="font-medium text-propeller-blue-dark">{businessName}</span>
            </>
          ) : (
            <>Set up your account</>
          )}
        </h1>
        <p className="text-[15px] text-warm-muted leading-relaxed">
          Just a few details and you&rsquo;ll be in.
        </p>
      </div>

      {acceptInviteMutation.isError && (
        <Alert severity="danger" title="Couldn't accept invite" className="mb-5">
          {(acceptInviteMutation.error as { message?: string } | null)?.message ?? 'Please try again.'}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              placeholder="First name"
              value={formData.firstName}
              onChange={handleInputChange}
              autoComplete="given-name"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              placeholder="Last name"
              value={formData.lastName}
              onChange={handleInputChange}
              autoComplete="family-name"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={formData.email} readOnly disabled />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
          <PasswordStrength password={formData.password} className="mt-3" />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full mt-2"
          disabled={!isFormValid}
          loading={acceptInviteMutation.isPending}
        >
          Accept invite
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-warm-muted">
        Already have an account?{' '}
        <Link
          href="/auth/login"
          className="font-semibold text-warm-text hover:text-propeller-blue transition-colors"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}

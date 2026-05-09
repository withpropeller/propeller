'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { TextInput, Button, Alert, AlertDescription, AlertTitle } from '@/lib/pax'
import { Check } from 'lucide-react'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { useGetInvitation, useAcceptInvite } from '@/hooks/useSignup'
import { API_STATUS } from '@/lib/constants'

export default function InvitePage() {
  const params = useParams()
  const businessId = params?.businessId as string
  const inviteCode = params?.inviteCode as string

  const [done, setDone] = useState(false)
  const [invalidToken, setInvalidToken] = useState(false)
  const [invitationDetails, setInvitationDetails] = useState<any>(null)
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
      onSuccess: (res: any) => {
        const data = res?.data ?? res
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
        onSuccess: (res: any) => {
          if (res?.code === API_STATUS.SUCCESS || !res?.code) setDone(true)
        },
      }
    )
  }

  const isFormValid =
    formData.firstName.trim() && formData.lastName.trim() && formData.password.length >= 8

  const businessName = invitationDetails?.user?.businessName

  if (done) {
    return (
      <AuthShell altAction={null}>
        <div className="text-center">
          <div className="w-14 h-14 bg-feedback-success-light rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="text-feedback-success-main" size={28} />
          </div>
          <h1 className="text-2xl font-semibold text-content-primary mb-3">You're all set</h1>
          <p className="text-sm text-content-secondary mb-8 leading-relaxed">
            Your account is active. Sign in to access{' '}
            <span className="font-medium text-content-primary">
              {businessName ?? 'your workspace'}
            </span>
            .
          </p>
          <Button asChild variant="default" className="w-full">
            <Link href="/auth/login">Sign in</Link>
          </Button>
        </div>
      </AuthShell>
    )
  }

  if (invalidToken) {
    return (
      <AuthShell altAction={{ label: 'Sign in', href: '/auth/login' }}>
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-content-primary leading-tight">
            Invite isn't valid anymore
            <br />
            Ask your admin to resend it
          </h1>
        </div>
        <Button asChild variant="default" className="w-full">
          <Link href="/auth/login">Back to sign in</Link>
        </Button>
      </AuthShell>
    )
  }

  if (getInvitationMutation.isPending || !invitationDetails) {
    return (
      <AuthShell altAction={null}>
        <p className="text-center text-sm text-content-tertiary">Loading invitation…</p>
      </AuthShell>
    )
  }

  return (
    <AuthShell altAction={{ label: 'Sign in', href: '/auth/login' }}>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-content-primary leading-tight">
          You've been invited
          {businessName && (
            <>
              <br />
              <span className="font-normal text-content-secondary">to join {businessName}</span>
            </>
          )}
        </h1>
      </div>

      {acceptInviteMutation.isError && (
        <Alert severity="danger" className="mb-6">
          <AlertTitle>Couldn't accept invite</AlertTitle>
          <AlertDescription>
            {(acceptInviteMutation.error as any)?.message ?? 'Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-content-primary mb-1.5"
            >
              First name
            </label>
            <TextInput
              id="firstName"
              placeholder="First name"
              value={formData.firstName}
              onChange={handleInputChange}
              autoComplete="given-name"
              required
            />
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-content-primary mb-1.5"
            >
              Last name
            </label>
            <TextInput
              id="lastName"
              placeholder="Last name"
              value={formData.lastName}
              onChange={handleInputChange}
              autoComplete="family-name"
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-content-primary mb-1.5"
          >
            Email
          </label>
          <TextInput id="email" type="email" value={formData.email} readOnly disabled />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-content-primary mb-1.5"
          >
            Password
          </label>
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
          variant="default"
          className="w-full mt-2"
          disabled={!isFormValid || acceptInviteMutation.isPending}
          loading={acceptInviteMutation.isPending}
        >
          Accept invite
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-content-secondary">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-medium link">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}

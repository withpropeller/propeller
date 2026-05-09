'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TextInput, Alert, AlertDescription, AlertTitle, Button } from '@/lib/pax'
import { AuthShell } from '@/components/auth/AuthShell'
import { BottomIllustration } from '@/components/auth/BottomIllustration'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { useLogin } from '@/hooks/useAuth'
import { useResendConfirmation } from '@/hooks/useSignup'
import { API_STATUS } from '@/lib/constants'
import { getAuthErrorMessage } from '@/lib/format'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resendSent, setResendSent] = useState(false)

  const router = useRouter()
  const loginMutation = useLogin()
  const resendMutation = useResendConfirmation()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    loginMutation.mutate({ email, password }, {
      onSuccess: (res) => {
        if (res.code === API_STATUS.MFA_REQUIRED && res.data) {
          const searchParams = new URLSearchParams({
            email,
            stateToken: (res.data as any).stateToken || '',
          })
          router.push(`/auth/mfa?${searchParams.toString()}`)
        } else if (res.code === API_STATUS.SUCCESS) {
          router.push('/')
        }
      },
    })
  }

  const { isPending: processing, error: mutationError } = loginMutation
  const loginData = loginMutation.data as any
  const isPending =
    (mutationError as any)?.code === API_STATUS.PENDING ||
    loginData?.code === API_STATUS.PENDING
  const bodyError =
    loginData &&
    !isPending &&
    loginData?.code !== API_STATUS.SUCCESS &&
    loginData?.code !== API_STATUS.MFA_REQUIRED
      ? loginData?.message || 'Login failed. Please try again.'
      : null
  const errorMessage = isPending ? null : (getAuthErrorMessage(mutationError) ?? bodyError)

  useEffect(() => {
    if (isPending && !resendSent) {
      resendMutation.mutate({ email }, {
        onSuccess: () => setResendSent(true),
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending])

  function handleResend() {
    resendMutation.mutate({ email }, {
      onSuccess: () => setResendSent(true),
    })
  }

  return (
    <AuthShell
      altAction={{ label: 'Sign up', href: '/signup' }}
      bottomLayer={<BottomIllustration />}
    >
      <div className="mb-12 text-center">
        <h1 className="text-2xl font-semibold text-content-primary leading-tight">
          Welcome back
          <br />
          Sign in with your email
        </h1>
      </div>

      {isPending && (
        <Alert severity="warning" className="mb-6">
          <AlertTitle>Email not confirmed</AlertTitle>
          <AlertDescription>
            Please check your inbox and confirm your email before signing in.{' '}
            {resendSent ? (
              <span className="font-medium">Confirmation email sent.</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendMutation.isPending}
                className="font-medium underline disabled:opacity-50"
              >
                {resendMutation.isPending ? 'Sending…' : 'Resend email'}
              </button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="danger" className="mb-6">
          <AlertTitle>Login failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-content-primary mb-1.5"
          >
            Email
          </label>
          <TextInput
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-content-primary">
              Password
            </label>
            <Link href="/auth/reset" className="text-sm font-medium link">
              Forgot your password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        <Button
          type="submit"
          variant="default"
          className="w-full mt-2"
          disabled={processing || !email || !password}
          loading={processing}
        >
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-content-secondary">
        Don't have an account?{' '}
        <Link href="/signup" className="font-medium link">
          Sign up
        </Link>
      </p>
    </AuthShell>
  )
}
